import { Hono } from 'hono';

import { isEmpty } from '../../../../shared/helpers/is-empty';
import { supportPostSchema } from '../../../../shared/schemas/support-post-schema';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { getIp } from '../../../helpers/get-ip';
import { mergeIssues } from '../../../helpers/merge-issues';
import { validateTurnstile } from '../../../helpers/validate-turnstile';

import type { HonoBindings } from '../../../types/hono-bindings';

export const posts = new Hono<{ Bindings: HonoBindings; }>();
export const postsPath = '/posts';

posts.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const siteId = context.req.query('id');
  const hasSiteId = !isEmpty(siteId);
  const pageSize = 100;
  const offset = (page - 1) * pageSize;
  
  const query = hasSiteId
    ? 'SELECT id, site_id, user_name, content, is_admin, created_at FROM posts WHERE site_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    : 'SELECT id, site_id, user_name, content, is_admin, created_at FROM posts                   ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const result = hasSiteId
    ? await context.env.DB.prepare(query).bind(Number(siteId), pageSize, offset).all()
    : await context.env.DB.prepare(query).bind(                pageSize, offset).all();
  
  return context.json({ result: { page, items: result.results ?? [] } }, 200);
});

posts.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const parsedResult = supportPostSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, 400);
  
  const parsed = parsedResult.data;
  
  const ip = getIp(context);
  const isValidTurnstile = await validateTurnstile(context.env.TURNSTILE_SECRET_KEY, parsed.turnstile_token, ip);
  if(!isValidTurnstile) return context.json({ error: 'Turnstile 認証に失敗しました' }, 400);
  
  const result = await context.env.DB
    .prepare('INSERT INTO posts (site_id, user_name, content, ip, is_admin, created_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)')
    .bind(parsed.site_id, parsed.user_name, parsed.content, ip)
    .run() as D1Result & { lastInsertRowId?: number; };
  return context.json({ result: { id: result.lastInsertRowId } }, 201);
});
