import { Hono } from 'hono';

import type { HonoBindings } from '../../../types/hono-bindings';

export const sites = new Hono<{ Bindings: HonoBindings; }>();
export const sitesPath = '/sites';

sites.get('/', async context => {
  return context.json({ resut: 'TODO' }, 200);
});
