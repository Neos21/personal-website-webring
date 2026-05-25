import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { adminConstants } from '../../../../shared/constants/admin';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { convertToPositiveInteger } from '../../../../shared/helpers/convert-to-positive-integer';
import { AdminSiteIpsRepository } from '../../../repositories/admin/admin-site-ips-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminSiteIps = new Hono<{ Bindings: HonoBindings; }>();
export const adminSiteIpsPath = '/site-ips';

adminSiteIps.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminSiteIps.get('/', async context => {
  const page = convertToPositiveInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * adminConstants.siteIpsPageSize;
  
  const siteIps = await new AdminSiteIpsRepository(context.env.DB).findPage(adminConstants.siteIpsPageSize + 1, offset);
  const hasNext = siteIps.length > adminConstants.siteIpsPageSize;
  if(hasNext) siteIps.length = adminConstants.siteIpsPageSize;
  return context.json({ result: { page, site_ips: siteIps, has_next: hasNext } }, httpStatusCode.ok);
});
