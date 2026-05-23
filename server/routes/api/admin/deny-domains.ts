import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { adminNewDenyDomainSchema } from '../../../../shared/schemas/admin/admin-deny-domain-schema';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { AdminDenyDomainsRepository } from '../../../repositories/admin/admin-deny-domains-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminDenyDomains = new Hono<{ Bindings: HonoBindings; }>();
export const adminDenyDomainsPath = '/deny-domains';

adminDenyDomains.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminDenyDomains.get('/', async context => {
  const result = await new AdminDenyDomainsRepository(context.env.DB).findAll();
  return context.json({ result }, httpStatusCode.ok);
});

adminDenyDomains.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminNewDenyDomainSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const adminDenyDomainsRepository = new AdminDenyDomainsRepository(context.env.DB);
  
  const duplicate = await adminDenyDomainsRepository.findByDomain(parsed.data.domain);
  if(duplicate != null) return context.json({ error: 'このドメインは既に登録されています' }, httpStatusCode.badRequest);
  
  const id = await adminDenyDomainsRepository.create(parsed.data.domain);
  return context.json({ result: { id } }, httpStatusCode.created);
});

adminDenyDomains.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const adminDenyDomainsRepository = new AdminDenyDomainsRepository(context.env.DB);
  
  const existing = await adminDenyDomainsRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のドメインが見つかりませんでした' }, httpStatusCode.notFound);
  
  await adminDenyDomainsRepository.deleteById(idParsed.data);
  return context.body(null, httpStatusCode.noContent);
});
