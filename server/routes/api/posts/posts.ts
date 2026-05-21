import { Hono } from 'hono';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { postsConstants } from '../../../../shared/constants/posts';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { supportPostSchema } from '../../../../shared/schemas/support-post-schema';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { getIp } from '../../../helpers/get-ip';
import { validateTurnstile } from '../../../helpers/validate-turnstile';
import { DenyIpsRepository } from '../../../repositories/deny-ips-repository';
import { PostsRepository } from '../../../repositories/posts-repository';
import { SitesRepository } from '../../../repositories/sites-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const posts = new Hono<{ Bindings: HonoBindings; }>();
export const postsPath = '/posts';

posts.get('/', async context => {
  const rawSiteId = context.req.query('id');
  const siteId = convertToInteger(rawSiteId);
  // `?id=abc` などの異常値を弾く
  if(!isEmpty(rawSiteId) && siteId == null) return context.json({ error: 'サイト ID が不正です' }, httpStatusCode.badRequest);
  
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * postsConstants.pageSize;
  
  const posts = await new PostsRepository(context.env.DB).findPage(postsConstants.pageSize + 1, offset, siteId);
  const hasNext = posts.length > postsConstants.pageSize;
  if(hasNext) posts.length = postsConstants.pageSize;
  return context.json({ result: { page, posts, has_next: hasNext } }, httpStatusCode.ok);
});

posts.post('/', async context => {
  const ip = getIp(context);
  if(ip !== 'Unknown' && await new DenyIpsRepository(context.env.DB).isIpDenied(ip)) return context.json({ error: '操作できませんでした' }, httpStatusCode.forbidden);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = supportPostSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const isValidTurnstile = await validateTurnstile(context.env.TURNSTILE_SECRET_KEY, parsed.data.turnstile_token, ip);
  if(!isValidTurnstile) return context.json({ error: 'Turnstile 認証に失敗しました' }, httpStatusCode.badRequest);
  
  // サイト ID 指定時は存在チェックをする
  if(parsed.data.site_id != null) {
    const site = await new SitesRepository(context.env.DB).findActiveById(parsed.data.site_id);
    if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  }
  
  const postId = await new PostsRepository(context.env.DB).create({ content: parsed.data.content, ip, is_admin: 0, site_id: parsed.data.site_id ?? null, user_name: parsed.data.user_name });
  return context.json({ result: { id: postId } }, httpStatusCode.created);
});
