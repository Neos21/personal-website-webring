import { Hono } from 'hono';

import { admin, adminPath } from './admin/admin';
import { denyDomains, denyDomainsPath } from './deny-domains/deny-domains';
import { next, nextPath } from './next/next';
import { posts, postsPath } from './posts/posts';
import { prev, prevPath } from './prev/prev';
import { random, randomPath } from './random/random';
import { sites, sitesPath } from './sites/sites';

import type { HonoBindings } from '../../types/hono-bindings';

export const api = new Hono<{ Bindings: HonoBindings; }>();
export const apiPath = '/api';

api.route(prevPath       , prev);
api.route(nextPath       , next);
api.route(randomPath     , random);
api.route(sitesPath      , sites);
api.route(postsPath      , posts);
api.route(denyDomainsPath, denyDomains);
api.route(adminPath      , admin);
