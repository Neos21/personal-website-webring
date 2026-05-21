import { Hono } from 'hono';

import { httpStatusCode } from '../../../../../shared/constants/http-status-code';
import { siteCommentsConstants } from '../../../../../shared/constants/site-comments';
import { mergeIssues } from '../../../../../shared/helpers/merge-issues';
import { siteCommentSchema } from '../../../../../shared/schemas/comment-schema';
import { idParamSchema } from '../../../../../shared/schemas/site-id-param-schema';
import { convertToInteger } from '../../../../helpers/convert-to-integer';
import { getIp } from '../../../../helpers/get-ip';
import { DenyIpsRepository } from '../../../../repositories/deny-ips-repository';
import { SiteCommentsRepository } from '../../../../repositories/site-comments-repository';
import { SitesRepository } from '../../../../repositories/sites-repository';

import type { HonoBindings } from '../../../../types/hono-bindings';

export const comments = new Hono<{ Bindings: HonoBindings; }>();
export const commentsPath = '/comments';

comments.get('/', async context => {
  const siteIdParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdParsed.success) return context.json({ error: 'リクエストパラメータが不正です' }, httpStatusCode.badRequest);
  
  const site = await new SitesRepository(context.env.DB).findActiveById(siteIdParsed.data);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * siteCommentsConstants.pageSize;
  
  const comments = await new SiteCommentsRepository(context.env.DB).findPage(siteIdParsed.data, siteCommentsConstants.pageSize + 1, offset);
  const hasNext = comments.length > siteCommentsConstants.pageSize;
  if(hasNext) comments.length = siteCommentsConstants.pageSize;
  return context.json({ result: { page, comments, has_next: hasNext } }, httpStatusCode.ok);
});

comments.post('/', async context => {
  const ip = getIp(context);
  if(ip !== 'Unknown' && await new DenyIpsRepository(context.env.DB).isIpDenied(ip)) return context.json({ error: '操作できませんでした' }, httpStatusCode.forbidden);
  
  const siteIdParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdParsed.success) return context.json({ error: 'リクエストパラメータが不正です' }, httpStatusCode.badRequest);
  
  const site = await new SitesRepository(context.env.DB).findActiveById(siteIdParsed.data);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = siteCommentSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const commentId = await new SiteCommentsRepository(context.env.DB).create({ content: parsed.data.content, ip, site_id: siteIdParsed.data, user_name: parsed.data.user_name });
  return context.json({ result: { id: commentId } }, httpStatusCode.created);
});
