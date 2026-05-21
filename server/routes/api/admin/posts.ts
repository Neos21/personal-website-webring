import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { PostsRepository } from '../../../repositories/posts-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminPosts = new Hono<{ Bindings: HonoBindings; }>();
export const adminPostsPath = '/posts';

adminPosts.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminPosts.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  
  const pageSize = 100;
  const offset = (page - 1) * pageSize;
  
  const postsRepository = new PostsRepository(context.env.DB);
  const items = await postsRepository.findPage(pageSize, offset, null);
  return context.json({ result: { page, items } }, httpStatusCode.ok);
});
