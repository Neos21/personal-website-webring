import { Hono } from 'hono';

import { api, apiPath } from './routes/api/api';

import type { HonoBindings } from './types/hono-bindings';

const app = new Hono<{ Bindings: HonoBindings; }>();

app.route(apiPath, api);

export default app;
