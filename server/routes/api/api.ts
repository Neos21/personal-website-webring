import { Hono } from 'hono';

import { sites, sitesPath } from './sites/sites';

import type { HonoBindings } from '../../types/hono-bindings';

export const api = new Hono<{ Bindings: HonoBindings; }>();
export const apiPath = '/api';

api.route(sitesPath, sites);
