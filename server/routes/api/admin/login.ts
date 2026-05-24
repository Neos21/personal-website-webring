import { Hono } from 'hono';
import { sign } from 'hono/jwt';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { adminLoginSchema, adminPasswordDisplayName } from '../../../../shared/schemas/admin/admin-login-schema';
import { getIp } from '../../../helpers/get-ip';
import { validateTurnstile } from '../../../helpers/validate-turnstile';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminLogin = new Hono<{ Bindings: HonoBindings; }>();
export const adminLoginPath = '/login';

adminLogin.post('/', async context => {
  if(isEmpty(context.env.ADMIN_PASSWORD) || isEmpty(context.env.ADMIN_JWT_SECRET)) return context.json({ error: 'エラーが発生しました' }, httpStatusCode.internalServerError);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminLoginSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  if(parsed.data.password !== context.env.ADMIN_PASSWORD) return context.json({ error: `${adminPasswordDisplayName}が一致しません` }, httpStatusCode.unauthorized);
  
  const ip = getIp(context);
  const isValidTurnstile = await validateTurnstile(context.env.TURNSTILE_SECRET_KEY, parsed.data.turnstile_token, ip);
  if(!isValidTurnstile) return context.json({ error: 'Turnstile 認証に失敗しました' }, httpStatusCode.badRequest);
  
  const now = Math.floor(Date.now() / 1000);
  const tokenExpiresInSeconds = 60 * 60 * 24 * 30;  // 30日間
  const token = await sign({ exp: now + tokenExpiresInSeconds, iat: now }, context.env.ADMIN_JWT_SECRET, 'HS256');
  return context.json({ result: { token } }, httpStatusCode.ok);
});
