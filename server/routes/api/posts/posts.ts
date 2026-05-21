import { Hono } from 'hono';

import { supportPostSchema } from '../../../../shared/schemas/support-post-schema';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { getIp } from '../../../helpers/get-ip';
import { mergeIssues } from '../../../helpers/merge-issues';
import { validateTurnstile } from '../../../helpers/validate-turnstile';
import { PostsRepository } from '../../../repositories/posts-repository';
import { SitesRepository } from '../../../repositories/sites-repository';

import type { HonoBindings } from '../../../types/hono-bindings';
import { isEmpty } from '../../../../shared/helpers/is-empty';

export const posts = new Hono<{ Bindings: HonoBindings; }>();
export const postsPath = '/posts';

posts.get('/', async context => {
  const rawSiteId = context.req.query('id');
  const siteId = convertToInteger(rawSiteId);
  // `?id=abc` などの異常値を弾く
  if(!isEmpty(rawSiteId) && siteId == null) return context.json({ error: 'サイト ID が不正です' }, 400);
  
  const page = convertToInteger(context.req.query('page')) ?? 1;
  
  const pageSize = 100;
  const offset = (page - 1) * pageSize;
  
  const postsRepository = new PostsRepository(context.env.DB);
  const items = await postsRepository.findPage(pageSize, offset, siteId);
  return context.json({ result: { page, items } }, 200);
});

posts.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, 400);
  
  const parsedResult = supportPostSchema.safeParse(body);
  if(!parsedResult.success) return context.json({ error: mergeIssues(parsedResult.error) }, 400);
  
  const parsed = parsedResult.data;
  const postsRepository = new PostsRepository(context.env.DB);
  const sitesRepository = new SitesRepository(context.env.DB);
  
  const ip = getIp(context);
  const isValidTurnstile = await validateTurnstile(context.env.TURNSTILE_SECRET_KEY, parsed.turnstile_token, ip);
  if(!isValidTurnstile) return context.json({ error: 'Turnstile 認証に失敗しました' }, 400);
  
  // サイト ID での存在チェックをする
  if(parsed.site_id != null) {
    const site = await sitesRepository.findActiveById(parsed.site_id);
    if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, 404);
  }
  
  const postId = await postsRepository.create({ content: parsed.content, ip, is_admin: 0, site_id: parsed.site_id ?? null, user_name: parsed.user_name });
  return context.json({ result: { id: postId } }, 201);
});
