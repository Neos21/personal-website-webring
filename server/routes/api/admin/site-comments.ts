import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { adminConstants } from '../../../../shared/constants/admin';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { convertToPositiveInteger } from '../../../../shared/helpers/convert-to-positive-integer';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { adminUpdateSiteCommentSchema } from '../../../../shared/schemas/admin/admin-site-comment-schema';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { AdminSiteCommentsRepository } from '../../../repositories/admin/admin-site-comments-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminSiteComments = new Hono<{ Bindings: HonoBindings; }>();
export const adminSiteCommentsPath = '/site-comments';

adminSiteComments.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminSiteComments.get('/', async context => {
  const page = convertToPositiveInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * adminConstants.siteCommentsPageSize;
  
  const siteComments = await new AdminSiteCommentsRepository(context.env.DB).findPage(adminConstants.siteCommentsPageSize + 1, offset);
  const hasNext = siteComments.length > adminConstants.siteCommentsPageSize;
  if(hasNext) siteComments.length = adminConstants.siteCommentsPageSize;
  return context.json({ result: { page, site_comments: siteComments, has_next: hasNext } }, httpStatusCode.ok);
});

adminSiteComments.get('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const siteComment = await new AdminSiteCommentsRepository(context.env.DB).findById(idParsed.data);
  if(siteComment == null) return context.json({ error: '対象のコメントが見つかりませんでした' }, httpStatusCode.notFound);
  
  return context.json({ result: siteComment }, httpStatusCode.ok);
});

adminSiteComments.put('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminUpdateSiteCommentSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const adminSiteCommentsRepository = new AdminSiteCommentsRepository(context.env.DB);
  
  const existing = await adminSiteCommentsRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のコメントが見つかりませんでした' }, httpStatusCode.notFound);
  
  await adminSiteCommentsRepository.update({
    id       : idParsed.data,
    user_name: parsed.data.user_name ?? null,
    content  : parsed.data.content
  });
  
  return context.json({ result: true }, httpStatusCode.ok);
});

adminSiteComments.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const adminSiteCommentsRepository = new AdminSiteCommentsRepository(context.env.DB);
  
  const existing = await adminSiteCommentsRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のコメントが見つかりませんでした' }, httpStatusCode.notFound);
  
  await adminSiteCommentsRepository.deleteById(idParsed.data);
  
  return context.body(null, httpStatusCode.noContent);
});
