import { Hono } from 'hono';

import { comments, commentsPath } from './comments/comments';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { idParamSchema } from '../../../../shared/schemas/site-id-param-schema';
import { newSiteSchema, passwordDisplayName } from '../../../../shared/schemas/site-schema';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { getIp } from '../../../helpers/get-ip';
import { hashPassword } from '../../../helpers/hash-password';
import { mergeIssues } from '../../../helpers/merge-issues';
import { validateTurnstile } from '../../../helpers/validate-turnstile';
import { SiteCommentsRepository } from '../../../repositories/site-comments-repository';
import { SiteIpsRepository } from '../../../repositories/site-ips-repository';
import { SiteTagsRepository } from '../../../repositories/site-tags-repository';
import { SitesRepository } from '../../../repositories/sites-repository';
import { SiteUrlService } from '../../../services/site-url-service';

import type { HonoBindings } from '../../../types/hono-bindings';

export const sites = new Hono<{ Bindings: HonoBindings; }>();
export const sitesPath = '/sites';

sites.route('/:id' + commentsPath, comments);  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing

sites.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  
  const pageSize = 100;
  const offset = (page - 1) * pageSize;
  
  const sitesRepository = new SitesRepository(context.env.DB);
  const items = await sitesRepository.findActivePage(pageSize, offset);
  return context.json({ result: { page, items } }, 200);
});

sites.get('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const sitesRepository = new SitesRepository(context.env.DB);
  
  const site = await sitesRepository.findActiveById(siteId);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  return context.json({ result: site }, 200);
});

sites.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const parsedResult = newSiteSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, 400);
  
  const parsed = parsedResult.data;
  const sitesRepository = new SitesRepository(context.env.DB);
  const siteIpsRepository = new SiteIpsRepository(context.env.DB);
  const siteTagsRepository = new SiteTagsRepository(context.env.DB);
  const siteCommentsRepository = new SiteCommentsRepository(context.env.DB);
  const siteUrlService = new SiteUrlService();
  
  const ip = getIp(context);
  const isValidTurnstile = await validateTurnstile(context.env.TURNSTILE_SECRET_KEY, parsed.turnstile_token, ip);
  if(!isValidTurnstile) return context.json({ error: 'Turnstile 認証に失敗しました' }, 400);
  
  const urlMatch = await siteUrlService.findSiteUrlMatch(sitesRepository, parsed.url);
  if(urlMatch.exactMatchId != null) return context.json({ error: `この URL は既に登録されています : ID [${urlMatch.exactMatchId}]` }, 400);
  
  const rawPassword = typeof parsed.password === 'string' ? parsed.password : '';
  const passwordHash = rawPassword !== '' ? await hashPassword(rawPassword) : null;
  const siteId = await sitesRepository.create({
    banner_height : parsed.banner_height ?? null,
    banner_url    : parsed.banner_url,
    banner_width  : parsed.banner_width ?? null,
    description   : parsed.description,
    is_self       : parsed.is_self,
    owner_name    : parsed.owner_name,
    password_hash : passwordHash,
    site_name     : parsed.site_name,
    url           : parsed.url
  });
  await siteIpsRepository.create({ ip, is_created: 1, is_self: parsed.is_self, site_id: siteId });
  
  if(parsed.tags.length > 0) await siteTagsRepository.attachNames(siteId, parsed.tags);
  
  if(parsed.is_self === 0 && !isEmpty(parsed.recommender_comment)) await siteCommentsRepository.create({ content: parsed.recommender_comment!, ip, site_id: siteId, user_name: parsed.recommender_name });
  
  return context.json({ result: { id: siteId, warning: urlMatch.nearMatchId != null ? `近い URL が登録済みです : ID [${urlMatch.nearMatchId}]` : null } }, 201);
});

sites.put('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const sitesRepository = new SitesRepository(context.env.DB);
  const siteIpsRepository = new SiteIpsRepository(context.env.DB);
  const siteTagsRepository = new SiteTagsRepository(context.env.DB);
  const siteUrlService = new SiteUrlService();
  
  const existing = await sitesRepository.findAuthById(siteId);
  if(existing == null || existing.is_deleted === 1) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  const parsedResult = newSiteSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, 400);
  
  const parsed = parsedResult.data;
  const urlMatch = await siteUrlService.findSiteUrlMatch(sitesRepository, parsed.url, siteId);
  if(urlMatch.exactMatchId != null) return context.json({ error: `この URL は既に登録されています : ID [${urlMatch.exactMatchId}]` }, 400);
  
  if(existing.is_self === 0) {
    if(isEmpty(parsed.password)) return context.json({ error: `${passwordDisplayName}を設定することで自薦サイトに切り替えられます` }, 403);
  }
  else {
    if(isEmpty(existing.password_hash)) return context.json({ error: `${passwordDisplayName}が登録されていません` }, 403);
    
    const currentHash = await hashPassword(typeof parsed.password === 'string' ? parsed.password : '');
    if(currentHash !== existing.password_hash) return context.json({ error: `${passwordDisplayName}が一致しません` }, 401);
  }
  
  const rawPassword = typeof parsed.password === 'string' ? parsed.password : '';
  const passwordHash = rawPassword ? await hashPassword(rawPassword) : existing.password_hash;
  const isSelf = existing.is_self === 1 || !isEmpty(parsed.password) ? 1 : 0;
  
  await sitesRepository.update({
    banner_height : parsed.banner_height ?? null,
    banner_url    : parsed.banner_url,
    banner_width  : parsed.banner_width ?? null,
    description   : parsed.description,
    id            : siteId,
    is_self       : isSelf,
    owner_name    : parsed.owner_name,
    password_hash : passwordHash,
    site_name     : parsed.site_name,
    url           : parsed.url
  });
  
  const ip = getIp(context);
  await siteIpsRepository.create({ ip, is_created: 0, is_self: isSelf, site_id: siteId });
  
  await siteTagsRepository.replaceNames(siteId, parsed.tags);
  
  return context.json({ result: { id: siteId, warning: urlMatch.nearMatchId != null ? `近い URL が登録済みです : ID [${urlMatch.nearMatchId}]` : null } }, 200);
});

sites.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const sitesRepository = new SitesRepository(context.env.DB);
  const siteIpsRepository = new SiteIpsRepository(context.env.DB);
  
  const existing = await sitesRepository.findAuthById(siteId);
  if(existing == null || existing.is_deleted === 1) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  const password = typeof body.password === 'string' ? body.password.trim() : '';
  if(password === '') return context.json({ error: `${passwordDisplayName}を入力してください` }, 400);
  
  if(isEmpty(existing.password_hash)) return context.json({ error: `${passwordDisplayName}が登録されていません` }, 403);
  
  const currentHash = await hashPassword(password);
  if(currentHash !== existing.password_hash) return context.json({ error: `${passwordDisplayName}が一致しません` }, 401);
  
  await sitesRepository.markDeleted(siteId);  // 論理削除する
  
  const ip = getIp(context);
  await siteIpsRepository.create({ ip, is_created: 0, is_self: existing.is_self, site_id: siteId });
  
  return context.json({ result: { id: siteId } }, 200);
});
