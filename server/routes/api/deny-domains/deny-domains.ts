import { Hono } from 'hono';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { DenyDomainsRepository } from '../../../repositories/deny-domains-repository';
import { DenyDomainService } from '../../../services/deny-domain-service';

import type { HonoBindings } from '../../../types/hono-bindings';

export const denyDomains = new Hono<{ Bindings: HonoBindings; }>();
export const denyDomainsPath = '/deny-domains';

denyDomains.get('/search', async context => {
  const url = context.req.query('url')!;
  if(isEmpty(url)) return context.json({ error: 'URL パラメータが不正です' }, httpStatusCode.badRequest);
  
  const domain = await new DenyDomainService().findMatchedDomain(new DenyDomainsRepository(context.env.DB), url);
  return context.json({ result: { is_denied: domain != null } }, httpStatusCode.ok);
});
