import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { postsConstants } from '../../../../shared/constants/posts';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { PostsRepository } from '../../../repositories/posts-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminPosts = new Hono<{ Bindings: HonoBindings; }>();
export const adminPostsPath = '/posts';

adminPosts.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminPosts.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * postsConstants.pageSize;
  
  const posts = await new PostsRepository(context.env.DB).findPage(postsConstants.pageSize + 1, offset, null);
  const hasNext = posts.length > postsConstants.pageSize;
  if(hasNext) posts.length = postsConstants.pageSize;
  return context.json({ result: { page, posts, has_next: hasNext } }, httpStatusCode.ok);
});
