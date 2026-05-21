import { Hono } from 'hono';

import { admin, adminPath } from './admin/admin';
import { posts, postsPath } from './posts/posts';
import { sites, sitesPath } from './sites/sites';

import type { HonoBindings } from '../../types/hono-bindings';

export const api = new Hono<{ Bindings: HonoBindings; }>();
export const apiPath = '/api';

api.route(sitesPath, sites);
api.route(postsPath, posts);
api.route(adminPath, admin);
