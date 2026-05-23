import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { adminConstants } from '../../../../shared/constants/admin';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { adminNewPostSchema } from '../../../../shared/schemas/admin/admin-post-schema';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { getIp } from '../../../helpers/get-ip';
import { AdminPostsRepository } from '../../../repositories/admin/admin-posts-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminPosts = new Hono<{ Bindings: HonoBindings; }>();
export const adminPostsPath = '/posts';

adminPosts.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminPosts.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * adminConstants.postsPageSize;
  
  const posts = await new AdminPostsRepository(context.env.DB).findPage(adminConstants.postsPageSize + 1, offset, null);
  const hasNext = posts.length > adminConstants.postsPageSize;
  if(hasNext) posts.length = adminConstants.postsPageSize;
  return context.json({ result: { page, posts, has_next: hasNext } }, httpStatusCode.ok);
});

adminPosts.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminNewPostSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const adminPostsRepository = new AdminPostsRepository(context.env.DB);
  await adminPostsRepository.create({
    site_id  : parsed.data.site_id ?? null,
    user_name: parsed.data.user_name,
    content  : parsed.data.content,
    ip       : getIp(context),
    is_admin : 1
  });
  
  return context.json({ result: true }, httpStatusCode.created);  // TODO : ID 返す
});
