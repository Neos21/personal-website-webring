import { Hono } from 'hono';

import { api, apiPath } from './routes/api/api';
import { next, nextPath } from './routes/next/next';
import { prev, prevPath } from './routes/prev/prev';
import { random, randomPath } from './routes/random/random';

import type { HonoBindings } from './types/hono-bindings';

const app = new Hono<{ Bindings: HonoBindings; }>();

app.route(apiPath   , api);
app.route(prevPath  , prev);
app.route(nextPath  , next);
app.route(randomPath, random);

export default app;
