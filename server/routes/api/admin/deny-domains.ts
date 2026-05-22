import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { newDenyDomainSchema } from '../../../../shared/schemas/deny-domain-schema';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { DenyDomainsRepository } from '../../../repositories/deny-domains-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminDenyDomains = new Hono<{ Bindings: HonoBindings; }>();
export const adminDenyDomainsPath = '/deny-domains';

adminDenyDomains.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminDenyDomains.get('/', async context => {
  const result = await new DenyDomainsRepository(context.env.DB).findAll();
  return context.json({ result }, httpStatusCode.ok);
});

adminDenyDomains.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = newDenyDomainSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const denyDomainsRepository = new DenyDomainsRepository(context.env.DB);
  const existingDomain = await denyDomainsRepository.findByDomain(parsed.data.domain);
  if(existingDomain != null) return context.json({ error: 'このドメインは既に登録されています' }, httpStatusCode.badRequest);
  
  const id = await denyDomainsRepository.create(parsed.data.domain);
  return context.json({ result: { id } }, httpStatusCode.created);
});

adminDenyDomains.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const denyDomainsRepository = new DenyDomainsRepository(context.env.DB);
  const existing = await denyDomainsRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のドメインが見つかりませんでした' }, httpStatusCode.notFound);
  
  await denyDomainsRepository.deleteById(idParsed.data);
  return context.body(null, httpStatusCode.noContent);
});
