import { Hono } from 'hono';

import { siteCommentSchema } from '../../../../../shared/schemas/comment-schema';
import { idParamSchema } from '../../../../../shared/schemas/site-id-param-schema';
import { getIp } from '../../../../helpers/get-ip';
import { mergeIssues } from '../../../../helpers/merge-issues';

import type { HonoBindings } from '../../../../types/hono-bindings';

export const comments = new Hono<{ Bindings: HonoBindings; }>();
export const commentsPath = '/comments';

comments.get('/', async context => {
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const site = await context.env.DB.prepare('SELECT id FROM sites WHERE id = ? AND is_deleted = 0 LIMIT 1').bind(siteId).first();
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  const result = await context.env.DB.prepare('SELECT id, user_name, content, created_at FROM site_comments WHERE site_id = ? ORDER BY created_at DESC').bind(siteId).all();
  return context.json({ result: result.results ?? [] }, 200);
});

comments.post('/', async context => {
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const site = await context.env.DB.prepare('SELECT id FROM sites WHERE id = ? AND is_deleted = 0 LIMIT 1').bind(siteId).first();
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const parsedResult = siteCommentSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, 400);
  
  const parsed = parsedResult.data;
  
  const ip = getIp(context);
  const result = await context.env.DB
    .prepare('INSERT INTO site_comments (site_id, user_name, content, ip) VALUES (?, ?, ?, ?)')
    .bind(siteId, parsed.user_name, parsed.content, ip)
    .run() as D1Result & { lastInsertRowId?: number; };
  return context.json({ result: { id: result.lastInsertRowId } }, 201);
});
