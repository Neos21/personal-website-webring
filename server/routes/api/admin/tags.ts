import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { TagsRepository } from '../../../repositories/tags-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminTags = new Hono<{ Bindings: HonoBindings; }>();
export const adminTagsPath = '/tags';

adminTags.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminTags.get('/', async context => {
  const result = await new TagsRepository(context.env.DB).findAll();
  return context.json({ result }, 200);
});
