import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { adminNewDenyIpSchema } from '../../../../shared/schemas/admin/admin-deny-ip-schema';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { AdminDenyIpsRepository } from '../../../repositories/admin/admin-deny-ips-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminDenyIps = new Hono<{ Bindings: HonoBindings; }>();
export const adminDenyIpsPath = '/deny-ips';

adminDenyIps.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminDenyIps.get('/', async context => {
  const result = await new AdminDenyIpsRepository(context.env.DB).findAll();
  return context.json({ result }, httpStatusCode.ok);
});

adminDenyIps.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminNewDenyIpSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  // TODO : 要修正
  const denyIpsRepository = new AdminDenyIpsRepository(context.env.DB);
  if(await denyIpsRepository.isIpDenied(parsed.data.ip)) return context.json({ error: 'この IP アドレスは既に登録されています' }, httpStatusCode.badRequest);
  
  const id = await denyIpsRepository.create(parsed.data.ip);
  return context.json({ result: { id } }, httpStatusCode.created);
});

adminDenyIps.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const adminDenyIpsRepository = new AdminDenyIpsRepository(context.env.DB);
  const existing = await adminDenyIpsRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象の IP アドレスが見つかりませんでした' }, httpStatusCode.notFound);
  
  await adminDenyIpsRepository.deleteById(idParsed.data);
  return context.body(null, httpStatusCode.noContent);
});
