import { Hono } from 'hono';

import type { HonoBindings } from '../../../../types/hono-bindings';

export const comments = new Hono<{ Bindings: HonoBindings; }>();
export const commentsPath = '/comments';

comments.get('/', async context => {
  const siteId = context.req.param('id');
  return context.json({ result: `TODO : comments list for site ${siteId}` }, 200);
});

comments.post('/', async context => {
  const siteId = context.req.param('id');
  return context.json({ result: `TODO : create comment for site ${siteId}` }, 201);
});
