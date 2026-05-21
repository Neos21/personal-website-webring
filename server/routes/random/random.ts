import { Hono } from 'hono';

import type { HonoBindings } from '../../types/hono-bindings';

export const random = new Hono<{ Bindings: HonoBindings; }>();
export const randomPath = '/random';

random.get('/', async context => {
  return context.text('TODO : random redirect');
});
