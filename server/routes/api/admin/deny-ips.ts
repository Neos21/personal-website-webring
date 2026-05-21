import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { denyIpSchema } from '../../../../shared/schemas/deny-ip-schema';
import { idParamSchema } from '../../../../shared/schemas/site-id-param-schema';
import { mergeIssues } from '../../../helpers/merge-issues';
import { DenyIpsRepository } from '../../../repositories/deny-ips-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminDenyIps = new Hono<{ Bindings: HonoBindings; }>();
export const adminDenyIpsPath = '/deny-ips';

adminDenyIps.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminDenyIps.get('/', async context => {
  const result = await new DenyIpsRepository(context.env.DB).findAll();
  return context.json({ result }, httpStatusCode.ok);
});

adminDenyIps.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsedResult = denyIpSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, httpStatusCode.badRequest);
  
  const denyIpsRepository = new DenyIpsRepository(context.env.DB);
  if(await denyIpsRepository.isIpDenied(parsedResult.data.ip)) return context.json({ error: 'この IP アドレスは既に登録されています' }, httpStatusCode.badRequest);
  
  const id = await denyIpsRepository.create(parsedResult.data.ip);
  return context.json({ result: { id } }, httpStatusCode.created);
});

adminDenyIps.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idResult = idParamSchema.safeParse(context.req.param('id'));
  if(!idResult.success) return context.json({ error: 'リクエストパラメータが不正です' }, httpStatusCode.badRequest);
  
  const denyIpsRepository = new DenyIpsRepository(context.env.DB);
  const existing = await denyIpsRepository.findById(idResult.data);
  if(existing == null) return context.json({ error: '対象の IP アドレスが見つかりませんでした' }, httpStatusCode.notFound);
  
  await denyIpsRepository.deleteById(idResult.data);
  return context.json({ result: { id: idResult.data } }, httpStatusCode.ok);
});
