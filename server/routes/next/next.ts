import { Hono } from 'hono';

import type { HonoBindings } from '../../types/hono-bindings';

export const next = new Hono<{ Bindings: HonoBindings; }>();
export const nextPath = '/next';

next.get('/', async context => {
  return context.text('TODO : next redirect');
});
