import { Hono } from 'hono';

import { adminLogin, adminLoginPath } from './login';

import type { HonoBindings } from '../../../types/hono-bindings';

export const admin = new Hono<{ Bindings: HonoBindings; }>();
export const adminPath = '/admin';

admin.route(adminLoginPath, adminLogin);

admin.get('/', async context => {
  return context.json({ result: 'TODO : admin root' }, 200);
});
