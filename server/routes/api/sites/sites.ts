import { Hono } from 'hono';

import { comments, commentsPath } from './comments/comments';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { sitesConstants } from '../../../../shared/constants/sites';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { deleteSiteSchema, updateSiteSchema, passwordDisplayName, newSiteSchema } from '../../../../shared/schemas/site-schema';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { getIp } from '../../../helpers/get-ip';
import { hashPassword } from '../../../helpers/hash-password';
import { validateTurnstile } from '../../../helpers/validate-turnstile';
import { DenyDomainsRepository } from '../../../repositories/deny-domains-repository';
import { DenyIpsRepository } from '../../../repositories/deny-ips-repository';
import { SiteCommentsRepository } from '../../../repositories/site-comments-repository';
import { SiteIpsRepository } from '../../../repositories/site-ips-repository';
import { SiteTagsRepository } from '../../../repositories/site-tags-repository';
import { SitesRepository } from '../../../repositories/sites-repository';
import { TagsRepository } from '../../../repositories/tags-repository';
import { DenyDomainService } from '../../../services/deny-domain-service';
import { SiteTagService } from '../../../services/site-tag-service';
import { SiteUrlService } from '../../../services/site-url-service';

import type { SitePublicWithTags } from '../../../../shared/types/site';
import type { HonoBindings } from '../../../types/hono-bindings';

export const sites = new Hono<{ Bindings: HonoBindings; }>();
export const sitesPath = '/sites';

sites.route(`/:id${commentsPath}`, comments);  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing

sites.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * sitesConstants.pageSize;
  
  const sites = await new SitesRepository(context.env.DB).findActivePage(sitesConstants.pageSize + 1, offset);
  const hasNext = sites.length > sitesConstants.pageSize;
  if(hasNext) sites.length = sitesConstants.pageSize;
  
  const siteTagsRepository = new SiteTagsRepository(context.env.DB);
  const sitesWithTags: Array<SitePublicWithTags> = await Promise.all(sites.map(async site => ({
    ...site,
    tags: await siteTagsRepository.findBySiteId(site.id)
  })));
  
  return context.json({ result: { page, sites: sitesWithTags, has_next: hasNext } }, httpStatusCode.ok);
});

// URL の完全一致・類似チェック (フォームの Blur 時に利用)
sites.get('/search-url', async context => {
  const url = context.req.query('url')!;
  if(isEmpty(url)) return context.json({ error: 'URL パラメータが不正です' }, httpStatusCode.badRequest);
  
  // ID 指定時はその ID を除外する
  const ignoreSiteId = convertToInteger(context.req.query('id'));
  
  const urlMatch = await new SiteUrlService().findSiteUrlMatch(new SitesRepository(context.env.DB), url, ignoreSiteId);
  return context.json({ result: { exact_match_id: urlMatch.exactMatchId, near_match_id: urlMatch.nearMatchId } }, httpStatusCode.ok);
});

sites.get('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const siteIdParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const site = await new SitesRepository(context.env.DB).findActiveById(siteIdParsed.data);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  const tags = await new SiteTagsRepository(context.env.DB).findBySiteId(siteIdParsed.data);
  return context.json({ result: { ...site, tags } }, httpStatusCode.ok);
});

sites.post('/', async context => {
  const ip = getIp(context);
  if(ip !== 'Unknown' && await new DenyIpsRepository(context.env.DB).isIpDenied(ip)) return context.json({ error: '操作できませんでした' }, httpStatusCode.forbidden);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = newSiteSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const isValidTurnstile = await validateTurnstile(context.env.TURNSTILE_SECRET_KEY, parsed.data.turnstile_token, ip);
  if(!isValidTurnstile) return context.json({ error: 'Turnstile 認証に失敗しました' }, httpStatusCode.badRequest);
  
  const denyDomain = await new DenyDomainService().findMatchedDomain(new DenyDomainsRepository(context.env.DB), parsed.data.url);
  if(denyDomain != null) return context.json({ error: 'このドメインは登録できません' }, httpStatusCode.badRequest);
  
  const sitesRepository = new SitesRepository(context.env.DB);
  
  const urlMatch = await new SiteUrlService().findSiteUrlMatch(sitesRepository, parsed.data.url);
  if(urlMatch.exactMatchId != null) return context.json({ error: `この URL は既に登録されています : ID [${urlMatch.exactMatchId}]` }, httpStatusCode.badRequest);
  
  // 自薦の場合は管理パスワードをハッシュ化する (自薦・他薦の選択とパスワードの組合せ入力はスキーマでチェック済)
  const passwordHash = parsed.data.is_self === 1 ? await hashPassword(parsed.data.password!) : null;
  const id = await sitesRepository.create({
    is_self       : parsed.data.is_self,
    url           : parsed.data.url,
    site_name     : parsed.data.site_name,
    owner_name    : parsed.data.owner_name,
    description   : parsed.data.description,
    banner_url    : parsed.data.banner_url,
    banner_width  : parsed.data.banner_width  ?? null,
    banner_height : parsed.data.banner_height ?? null,
    password_hash : passwordHash
  });
  
  await new SiteIpsRepository(context.env.DB).create({ ip, is_created: 1, is_self: parsed.data.is_self, site_id: id });
  
  // タグを登録する
  await new SiteTagService().attachNames(new SiteTagsRepository(context.env.DB), new TagsRepository(context.env.DB), id, parsed.data.tags);
  
  // 他薦時のコメントを登録する
  if(parsed.data.is_self === 0) await new SiteCommentsRepository(context.env.DB).create({
    site_id  : id,
    user_name: parsed.data.recommender_name,
    content  : parsed.data.recommender_comment!,
    ip       : ip
  });
  
  return context.json({ result: { id } }, httpStatusCode.created);
});

sites.put('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const ip = getIp(context);
  if(ip !== 'Unknown' && await new DenyIpsRepository(context.env.DB).isIpDenied(ip)) return context.json({ error: '操作できませんでした' }, httpStatusCode.forbidden);
  
  const siteIdParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const sitesRepository = new SitesRepository(context.env.DB);
  
  const beforeSite = await sitesRepository.findAuthById(siteIdParsed.data);
  if(beforeSite == null || beforeSite.is_deleted === 1) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  const parsed = updateSiteSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const denyDomain = await new DenyDomainService().findMatchedDomain(new DenyDomainsRepository(context.env.DB), parsed.data.url);
  if(denyDomain != null) return context.json({ error: 'このドメインは登録できません' }, httpStatusCode.badRequest);
  
  const urlMatch = await new SiteUrlService().findSiteUrlMatch(sitesRepository, parsed.data.url, siteIdParsed.data);
  if(urlMatch.exactMatchId != null) return context.json({ error: `この URL は既に登録されています : ID [${urlMatch.exactMatchId}]` }, httpStatusCode.badRequest);
  
  const passwordHash = await hashPassword(parsed.data.password);
  // 自薦状態での編集時はパスワードチェックを行う (他薦から自薦に切り替える最初はパスワードチェックをしない)
  if(beforeSite.is_self === 1 && passwordHash !== beforeSite.password_hash) return context.json({ error: `${passwordDisplayName}が一致しません` }, httpStatusCode.unauthorized);
  
  await sitesRepository.update({
    id            : siteIdParsed.data,
    url           : parsed.data.url,
    site_name     : parsed.data.site_name,
    owner_name    : parsed.data.owner_name,
    description   : parsed.data.description,
    banner_url    : parsed.data.banner_url,
    banner_width  : parsed.data.banner_width ?? null,
    banner_height : parsed.data.banner_height ?? null,
    password_hash : passwordHash
  });
  
  await new SiteIpsRepository(context.env.DB).create({ ip, is_created: 0, is_self: 1, site_id: siteIdParsed.data });
  
  // 紐付くタグを一度削除して再度登録する
  await new SiteTagService().replaceNames(new SiteTagsRepository(context.env.DB), new TagsRepository(context.env.DB), siteIdParsed.data, parsed.data.tags);
  
  return context.json({ result: true }, httpStatusCode.ok);
});

sites.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const ip = getIp(context);
  if(ip !== 'Unknown' && await new DenyIpsRepository(context.env.DB).isIpDenied(ip)) return context.json({ error: '操作できませんでした' }, httpStatusCode.forbidden);
  
  const siteIdParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!siteIdParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const sitesRepository = new SitesRepository(context.env.DB);
  
  const beforeSite = await sitesRepository.findAuthById(siteIdParsed.data);
  if(beforeSite == null || beforeSite.is_deleted === 1) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  if(isEmpty(beforeSite.password_hash)) return context.json({ error: `${passwordDisplayName}が登録されていません` }, httpStatusCode.forbidden);
  
  const parsed = deleteSiteSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const passwordHash = await hashPassword(parsed.data.password);
  if(passwordHash !== beforeSite.password_hash) return context.json({ error: `${passwordDisplayName}が一致しません` }, httpStatusCode.unauthorized);
  
  await sitesRepository.markDeleted(siteIdParsed.data);  // 論理削除する
  
  await new SiteIpsRepository(context.env.DB).create({ ip, is_created: 0, is_self: 1, site_id: siteIdParsed.data });
  
  return context.body(null, httpStatusCode.noContent);
});
