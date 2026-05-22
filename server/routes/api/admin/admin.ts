import { Hono } from 'hono';

import { adminDenyDomains, adminDenyDomainsPath } from './deny-domains';
import { adminDenyIps, adminDenyIpsPath } from './deny-ips';
import { adminLogin, adminLoginPath } from './login';
import { adminPosts, adminPostsPath } from './posts';
import { adminSites, adminSitesPath } from './sites';
import { adminTags, adminTagsPath } from './tags';

import type { HonoBindings } from '../../../types/hono-bindings';

export const admin = new Hono<{ Bindings: HonoBindings; }>();
export const adminPath = '/admin';

admin.route(adminLoginPath      , adminLogin);
admin.route(adminSitesPath      , adminSites);
admin.route(adminTagsPath       , adminTags);
admin.route(adminPostsPath      , adminPosts);
admin.route(adminDenyIpsPath    , adminDenyIps);
admin.route(adminDenyDomainsPath, adminDenyDomains);
