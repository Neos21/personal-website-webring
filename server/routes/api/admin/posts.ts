import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { adminConstants } from '../../../../shared/constants/admin';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { adminNewOrUpdatePostSchema } from '../../../../shared/schemas/admin/admin-post-schema';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { convertToPositiveInteger } from '../../../helpers/convert-to-positive-integer';
import { getIp } from '../../../helpers/get-ip';
import { AdminPostsRepository } from '../../../repositories/admin/admin-posts-repository';
import { SitesRepository } from '../../../repositories/sites-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminPosts = new Hono<{ Bindings: HonoBindings; }>();
export const adminPostsPath = '/posts';

adminPosts.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminPosts.get('/', async context => {
  const page = convertToPositiveInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * adminConstants.postsPageSize;
  
  const posts = await new AdminPostsRepository(context.env.DB).findPage(adminConstants.postsPageSize + 1, offset, null);
  const hasNext = posts.length > adminConstants.postsPageSize;
  if(hasNext) posts.length = adminConstants.postsPageSize;
  return context.json({ result: { page, posts, has_next: hasNext } }, httpStatusCode.ok);
});

// TODO : GET

adminPosts.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminNewOrUpdatePostSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  // サイト ID 指定時は存在チェックをする
  if(parsed.data.site_id != null) {
    const site = await new SitesRepository(context.env.DB).findActiveById(parsed.data.site_id);
    if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  }
  
  const id = await new AdminPostsRepository(context.env.DB).create({
    site_id  : parsed.data.site_id ?? null,
    user_name: parsed.data.user_name,
    content  : parsed.data.content,
    ip       : getIp(context)
  });
  return context.json({ result: { id } }, httpStatusCode.created);
});

adminPosts.put('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminNewOrUpdatePostSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const adminPostsRepository = new AdminPostsRepository(context.env.DB);
  
  const existing = await adminPostsRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象の投稿が見つかりませんでした' }, httpStatusCode.notFound);
  
  // サイト ID 指定時は存在チェックをする
  if(parsed.data.site_id != null) {
    const site = await new SitesRepository(context.env.DB).findActiveById(parsed.data.site_id);
    if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  }
  
  await adminPostsRepository.update({
    id       : idParsed.data,
    site_id  : parsed.data.site_id ?? null,
    user_name: parsed.data.user_name,
    content  : parsed.data.content
  });
  
  return context.json({ result: true }, httpStatusCode.ok);
});

adminSites.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const sitesRepository = new AdminSitesRepository(context.env.DB);
  
  const existing = await sitesRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  await new SiteTagsRepository(context.env.DB).deleteBySiteId(idParsed.data);
  await sitesRepository.deleteById(idParsed.data);
  
  return context.body(null, httpStatusCode.noContent);
});
