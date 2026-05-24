import { Hono } from 'hono';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { appConstants } from '../../../../shared/constants/app-constants';
import { convertToPositiveInteger } from '../../../../shared/helpers/convert-to-positive-integer';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { newPostSchema } from '../../../../shared/schemas/post-schema';
import { getIp } from '../../../helpers/get-ip';
import { validateTurnstile } from '../../../helpers/validate-turnstile';
import { DenyIpsRepository } from '../../../repositories/deny-ips-repository';
import { PostsRepository } from '../../../repositories/posts-repository';
import { SitesRepository } from '../../../repositories/sites-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const posts = new Hono<{ Bindings: HonoBindings; }>();
export const postsPath = '/posts';

posts.get('/', async context => {
  // ID 指定がある場合は `?id=abc` などの異常値を弾く
  const siteIdParam  = context.req.query('id');
  const siteIdParsed = idParamSchema.safeParse(siteIdParam);
  if(!isEmpty(siteIdParam) && !siteIdParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  // ID が指定された場合、そのサイトが有効でなければ投稿を返さない
  if(siteIdParsed.data != null) {
    const site = await new SitesRepository(context.env.DB).findActiveById(siteIdParsed.data);
    if(site == null) return context.json({ error: 'サイト ID が不正です' }, httpStatusCode.badRequest);
  }
  
  const page = convertToPositiveInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * appConstants.postsPageSize;
  
  const posts = await new PostsRepository(context.env.DB).findPage(appConstants.postsPageSize + 1, offset, siteIdParsed.success ? siteIdParsed.data : null);
  const hasNext = posts.length > appConstants.postsPageSize;
  if(hasNext) posts.length = appConstants.postsPageSize;
  return context.json({ result: { page, posts, has_next: hasNext } }, httpStatusCode.ok);
});

posts.post('/', async context => {
  const ip = getIp(context);
  if(ip !== 'Unknown' && await new DenyIpsRepository(context.env.DB).isIpDenied(ip)) return context.json({ error: '操作できませんでした' }, httpStatusCode.forbidden);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = newPostSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  // サイト ID 指定時は存在チェックをする
  if(parsed.data.site_id != null) {
    const site = await new SitesRepository(context.env.DB).findActiveById(parsed.data.site_id);
    if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  }
  
  const isValidTurnstile = await validateTurnstile(context.env.TURNSTILE_SECRET_KEY, parsed.data.turnstile_token, ip);
  if(!isValidTurnstile) return context.json({ error: 'Turnstile 認証に失敗しました' }, httpStatusCode.badRequest);
  
  const id = await new PostsRepository(context.env.DB).create({
    site_id  : parsed.data.site_id ?? null,
    user_name: parsed.data.user_name,
    content  : parsed.data.content,
    ip       : ip
  });
  return context.json({ result: { id } }, httpStatusCode.created);
});
