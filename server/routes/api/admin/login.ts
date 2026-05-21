import { Hono } from 'hono';
import { sign } from 'hono/jwt';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { adminLoginSchema, adminPasswordDisplayName } from '../../../../shared/schemas/admin-login-schema';
import { getIp } from '../../../helpers/get-ip';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { validateTurnstile } from '../../../helpers/validate-turnstile';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminLogin = new Hono<{ Bindings: HonoBindings; }>();
export const adminLoginPath = '/login';

adminLogin.post('/', async context => {
  if(isEmpty(context.env.ADMIN_PASSWORD) || isEmpty(context.env.ADMIN_JWT_SECRET)) return context.json({ error: 'エラーが発生しました' }, httpStatusCode.internalServerError);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsedResult = adminLoginSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, httpStatusCode.badRequest);
  
  const parsed = parsedResult.data;
  
  const ip = getIp(context);
  const isValidTurnstile = await validateTurnstile(context.env.TURNSTILE_SECRET_KEY, parsed.turnstile_token, ip);
  if(!isValidTurnstile) return context.json({ error: 'Turnstile 認証に失敗しました' }, httpStatusCode.badRequest);
  
  if(parsed.password !== context.env.ADMIN_PASSWORD) return context.json({ error: `${adminPasswordDisplayName}が一致しません` }, httpStatusCode.unauthorized);
  
  const now = Math.floor(Date.now() / 1000);
  const adminTokenExpiresInSeconds = 60 * 60 * 24 * 30;  // 30日間
  const token = await sign({ exp: now + adminTokenExpiresInSeconds, iat: now }, context.env.ADMIN_JWT_SECRET, 'HS256');
  return context.json({ result: { token } }, httpStatusCode.ok);
});
