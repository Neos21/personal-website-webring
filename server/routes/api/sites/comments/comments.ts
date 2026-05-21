import { Hono } from 'hono';

import { httpStatusCode } from '../../../../../shared/constants/http-status-code';
import { mergeIssues } from '../../../../../shared/helpers/merge-issues';
import { siteCommentSchema } from '../../../../../shared/schemas/comment-schema';
import { idParamSchema } from '../../../../../shared/schemas/site-id-param-schema';
import { getIp } from '../../../../helpers/get-ip';
import { DenyIpsRepository } from '../../../../repositories/deny-ips-repository';
import { SiteCommentsRepository } from '../../../../repositories/site-comments-repository';
import { SitesRepository } from '../../../../repositories/sites-repository';

import type { HonoBindings } from '../../../../types/hono-bindings';

export const comments = new Hono<{ Bindings: HonoBindings; }>();
export const commentsPath = '/comments';

comments.get('/', async context => {
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, httpStatusCode.badRequest);
  
  const siteId = siteIdResult.data;
  const sitesRepository = new SitesRepository(context.env.DB);
  const siteCommentsRepository = new SiteCommentsRepository(context.env.DB);
  
  const site = await sitesRepository.findActiveById(siteId);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  const result = await siteCommentsRepository.findBySiteId(siteId);
  return context.json({ result }, httpStatusCode.ok);
});

comments.post('/', async context => {
  const denyIpsRepository = new DenyIpsRepository(context.env.DB);
  const ip = getIp(context);
  if(ip !== 'Unknown' && await denyIpsRepository.isIpDenied(ip)) return context.json({ error: '操作できませんでした' }, httpStatusCode.forbidden);
  
  const siteIdResult = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, httpStatusCode.badRequest);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const siteId = siteIdResult.data;
  const sitesRepository = new SitesRepository(context.env.DB);
  const siteCommentsRepository = new SiteCommentsRepository(context.env.DB);
  
  const site = await sitesRepository.findActiveById(siteId);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  const parsedResult = siteCommentSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, httpStatusCode.badRequest);
  
  const parsed = parsedResult.data;
  
  const commentId = await siteCommentsRepository.create({ content: parsed.content, ip, site_id: siteId, user_name: parsed.user_name });
  return context.json({ result: { id: commentId } }, httpStatusCode.created);
});
