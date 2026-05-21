import { Hono } from 'hono';

import { comments, commentsPath } from './comments/comments';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { newSiteSchema } from '../../../../shared/schemas/site-schema';
import { idParamSchema } from '../../../../shared/schemas/site-id-param-schema';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { getIp } from '../../../helpers/get-ip';
import { hashPassword } from '../../../helpers/hash-password';
import { mergeIssues } from '../../../helpers/merge-issues';
import { normalizeUrlNearby } from '../../../helpers/normalize-url';
import { validateTurnstile } from '../../../helpers/validate-turnstile';

import type { HonoBindings } from '../../../types/hono-bindings';

export const sites = new Hono<{ Bindings: HonoBindings; }>();
export const sitesPath = '/sites';

sites.route('/:id' + commentsPath, comments);  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing

const createTag = async (db: D1Database, name: string): Promise<number> => {
  const existing = await db.prepare('SELECT id FROM tags WHERE lower(name) = lower(?) LIMIT 1').bind(name.toLowerCase()).first<{ id: number; }>();
  if(existing != null && existing.id != null) return existing.id;
  
  const result = await db.prepare('INSERT INTO tags (name) VALUES (?)').bind(name).run() as D1Result & { lastInsertRowId?: number; };
  return result.lastInsertRowId as number;
};

const attachTags = async (db: D1Database, siteId: number, tags: string[]): Promise<void> => {
  const uniqueTags = [...new Map(tags.map(tag => [tag.trim().toLowerCase(), tag.trim()])).values()];
  for(const tag of uniqueTags) {
    if(isEmpty(tag)) continue;
    const tagId = await createTag(db, tag);
    await db.prepare('INSERT OR IGNORE INTO site_tags (site_id, tag_id) VALUES (?, ?)').bind(siteId, tagId).run();
  }
};

const insertSiteIp = async (db: D1Database, siteId: number, isCreated: number, isSelf: number, ip: string): Promise<void> => {
  await db.prepare('INSERT INTO site_ips (site_id, is_created, is_self, ip) VALUES (?, ?, ?, ?)')
    .bind(siteId, isCreated, isSelf, ip)
    .run();
};

sites.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const pageSize = 100;
  const offset = (page - 1) * pageSize;
  const result = await context.env.DB
    .prepare('SELECT id, is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, created_at, updated_at FROM sites WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(pageSize, offset)
    .all();
  return context.json({ result: { page, items: result.results ?? [] } }, 200);
});

sites.get('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const site = await context.env.DB
    .prepare('SELECT id, is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, created_at, updated_at FROM sites WHERE id = ? AND is_deleted = 0 LIMIT 1')
    .bind(siteId)
    .first();
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  return context.json({ result: site }, 200);
});

sites.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const parsedResult = newSiteSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, 400);
  
  const parsed = parsedResult.data;
  
  const ip = getIp(context);
  const isValidTurnstile = await validateTurnstile(context.env.TURNSTILE_SECRET_KEY, parsed.turnstile_token, ip);
  if(!isValidTurnstile) return context.json({ error: 'Turnstile 認証に失敗しました' }, 400);
  
  const exactMatch = await context.env.DB
    .prepare('SELECT id FROM sites WHERE lower(url) = lower(?) AND is_deleted = 0 LIMIT 1')
    .bind(parsed.url)
    .first<{ id: number; }>();
  if(exactMatch != null && exactMatch.id != null) return context.json({ error: `この URL は既に登録されています : ID [${exactMatch.id}]` }, 400);
  
  const allSites = await context.env.DB.prepare('SELECT id, url FROM sites WHERE is_deleted = 0').all<{ id: number; url: string; }>();
  const normalizedInput = normalizeUrlNearby(parsed.url);
  const nearMatch = (allSites.results ?? []).find(site => normalizeUrlNearby(site.url) === normalizedInput);
  
  const rawPassword = typeof parsed.password === 'string' ? parsed.password : '';
  const passwordHash = rawPassword !== '' ? await hashPassword(rawPassword) : null;
  const insertResult = await context.env.DB
    .prepare('INSERT INTO sites (is_self, url, site_name, owner_name, description, banner_url, banner_width, banner_height, password_hash, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)')
    .bind(parsed.is_self, parsed.url, parsed.site_name, parsed.owner_name, parsed.description, parsed.banner_url, parsed.banner_width, parsed.banner_height, passwordHash)
    .run() as D1Result & { lastInsertRowId?: number; };
  
  const siteId = insertResult.lastInsertRowId as number;
  await insertSiteIp(context.env.DB, siteId, 0, parsed.is_self, ip);
  
  if(parsed.tags.length > 0) await attachTags(context.env.DB, siteId, parsed.tags);
  
  if(parsed.is_self === 0 && parsed.recommender_comment != null && parsed.recommender_comment !== '') await context.env.DB
    .prepare('INSERT INTO site_comments (site_id, user_name, content, ip) VALUES (?, ?, ?, ?)')
    .bind(siteId, parsed.recommender_name, parsed.recommender_comment, ip)
    .run();
  
  return context.json({ result: { id: siteId, warning: nearMatch ? `近い URL が登録済みです : ID [${nearMatch.id}]` : null } }, 201);
});

sites.put('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const ip = getIp(context);
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const existing = await context.env.DB.prepare('SELECT id, is_deleted, password_hash, is_self FROM sites WHERE id = ?').bind(siteId).first<{ id: number; is_deleted: number; password_hash: string | null; is_self: number }>();
  if(existing == null || existing.is_deleted === 1) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const parsedResult = newSiteSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, 400);
  
  const parsed = parsedResult.data;
  
  if(existing.is_self === 0) {
    if(isEmpty(parsed.password)) return context.json({ error: '管理パスワードを設定することで自薦サイトに切り替えられます' }, 403);
  }
  else {
    if(existing.password_hash == null || existing.password_hash === '') return context.json({ error: '管理パスワードが登録されていません' }, 403);
    
    const currentHash = await hashPassword(typeof parsed.password === 'string' ? parsed.password : '');
    if(currentHash !== existing.password_hash) return context.json({ error: '管理パスワードが一致しません' }, 401);
  }
  
  const rawPassword = typeof parsed.password === 'string' ? parsed.password : '';
  const passwordHash = rawPassword ? await hashPassword(rawPassword) : existing.password_hash;
  const isSelf = existing.is_self === 1 || !isEmpty(parsed.password) ? 1 : 0;
  
  await context.env.DB
    .prepare('UPDATE sites SET is_self = ?, url = ?, site_name = ?, owner_name = ?, description = ?, banner_url = ?, banner_width = ?, banner_height = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(isSelf, parsed.url, parsed.site_name, parsed.owner_name, parsed.description, parsed.banner_url, parsed.banner_width, parsed.banner_height, passwordHash, siteId)
    .run();
  await insertSiteIp(context.env.DB, siteId, 1, isSelf, ip);
  
  if(parsed.tags.length > 0) await attachTags(context.env.DB, siteId, parsed.tags);
  
  return context.json({ result: { id: siteId } }, 200);
});

sites.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const ip = getIp(context);
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const existing = await context.env.DB.prepare('SELECT id, is_deleted, password_hash, is_self FROM sites WHERE id = ?').bind(siteId).first<{ id: number; is_deleted: number; password_hash: string | null; is_self: number; }>();
  if(existing == null || existing.is_deleted === 1) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const password = typeof body?.password === 'string' ? body.password.trim() : '';
  if(password === '') return context.json({ error: '管理パスワードを入力してください' }, 400);
  
  if(isEmpty(existing.password_hash)) return context.json({ error: '管理パスワードが登録されていません' }, 403);
  
  const currentHash = await hashPassword(password);
  if(currentHash !== existing.password_hash) return context.json({ error: '管理パスワードが一致しません' }, 401);
  
  await context.env.DB.prepare('UPDATE sites SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(siteId).run();
  await insertSiteIp(context.env.DB, siteId, 1, existing.is_self, ip);
  
  return context.json({ result: { id: siteId } }, 200);
});
