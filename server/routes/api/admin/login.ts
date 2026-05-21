import { Hono } from 'hono';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminLogin = new Hono<{ Bindings: HonoBindings; }>();
export const adminLoginPath = '/login';

adminLogin.post('/', async context => {
  return context.json({ result: 'TODO : admin login' }, 200);
});
