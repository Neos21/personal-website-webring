import { Hono } from 'hono';

import { siteCommentSchema } from '../../../../../shared/schemas/comment-schema';
import { idParamSchema } from '../../../../../shared/schemas/site-id-param-schema';
import { getIp } from '../../../../helpers/get-ip';
import { mergeIssues } from '../../../../helpers/merge-issues';
import { SiteCommentsRepository } from '../../../../repositories/site-comments-repository';
import { SitesRepository } from '../../../../repositories/sites-repository';

import type { HonoBindings } from '../../../../types/hono-bindings';

export const comments = new Hono<{ Bindings: HonoBindings; }>();
export const commentsPath = '/comments';

comments.get('/', async context => {
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const sitesRepository = new SitesRepository(context.env.DB);
  const siteCommentsRepository = new SiteCommentsRepository(context.env.DB);
  
  const site = await sitesRepository.findActiveById(siteId);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  const result = await siteCommentsRepository.findBySiteId(siteId);
  return context.json({ result }, 200);
});

comments.post('/', async context => {
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, 400);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const siteId = siteIdResult.data;
  const sitesRepository = new SitesRepository(context.env.DB);
  const siteCommentsRepository = new SiteCommentsRepository(context.env.DB);
  
  const site = await sitesRepository.findActiveById(siteId);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  
  const parsedResult = siteCommentSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, 400);
  
  const parsed = parsedResult.data;
  
  const ip = getIp(context);
  const commentId = await siteCommentsRepository.create({ content: parsed.content, ip, site_id: siteId, user_name: parsed.user_name });
  return context.json({ result: { id: commentId } }, 201);
});
