import { Hono } from 'hono';

import type { HonoBindings } from '../../types/hono-bindings';

export const prev = new Hono<{ Bindings: HonoBindings; }>();
export const prevPath = '/prev';

prev.get('/', async context => {
  return context.text('TODO : prev redirect');
});
