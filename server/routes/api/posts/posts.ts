import { Hono } from 'hono';

import type { HonoBindings } from '../../../types/hono-bindings';

export const posts = new Hono<{ Bindings: HonoBindings; }>();
export const postsPath = '/posts';

posts.get('/', async context => {
  return context.json({ result: 'TODO : posts list' }, 200);
});

posts.post('/', async context => {
  return context.json({ result: 'TODO : create post' }, 201);
});
