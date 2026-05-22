import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { adminConstants } from '../../../../shared/constants/admin';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { PostsRepository } from '../../../repositories/posts-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminPosts = new Hono<{ Bindings: HonoBindings; }>();
export const adminPostsPath = '/posts';

adminPosts.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminPosts.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * adminConstants.postsPageSize;
  
  const posts = await new PostsRepository(context.env.DB).findPage(adminConstants.postsPageSize + 1, offset, null);
  const hasNext = posts.length > adminConstants.postsPageSize;
  if(hasNext) posts.length = adminConstants.postsPageSize;
  return context.json({ result: { page, posts, has_next: hasNext } }, httpStatusCode.ok);
});
