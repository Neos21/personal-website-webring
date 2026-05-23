import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { adminConstants } from '../../../../shared/constants/admin';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { adminUpdateSiteSchema } from '../../../../shared/schemas/admin/admin-site-schema';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { convertToPositiveInteger } from '../../../helpers/convert-to-positive-integer';
import { hashPassword } from '../../../helpers/hash-password';
import { AdminSitesRepository } from '../../../repositories/admin/admin-sites-repository';
import { SiteTagsRepository } from '../../../repositories/site-tags-repository';
import { TagsRepository } from '../../../repositories/tags-repository';
import { SiteTagService } from '../../../services/site-tag-service';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminSites = new Hono<{ Bindings: HonoBindings; }>();
export const adminSitesPath = '/sites';

adminSites.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminSites.get('/', async context => {
  const page = convertToPositiveInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * adminConstants.sitesPageSize;
  
  const sites = await new AdminSitesRepository(context.env.DB).findPage(adminConstants.sitesPageSize + 1, offset);
  const hasNext = sites.length > adminConstants.sitesPageSize;
  if(hasNext) sites.length = adminConstants.sitesPageSize;
  return context.json({ result: { page, sites, has_next: hasNext } }, httpStatusCode.ok);
});

adminSites.get('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const site = await new AdminSitesRepository(context.env.DB).findById(idParsed.data);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  const tags = await new TagsRepository(context.env.DB).findBySiteId(idParsed.data);
  return context.json({ result: { ...site, tags } }, httpStatusCode.ok);
});

adminSites.put('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminUpdateSiteSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const adminSitesRepository = new AdminSitesRepository(context.env.DB);
  
  const existing = await adminSitesRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  // 入力値があればパスワードを変更する
  const passwordHash = !isEmpty(parsed.data.password) ? await hashPassword(parsed.data.password) : existing.password_hash;
  
  await adminSitesRepository.update({
    id            : idParsed.data,
    is_self       : parsed.data.is_self,
    url           : parsed.data.url,
    site_name     : parsed.data.site_name,
    owner_name    : parsed.data.owner_name,
    description   : parsed.data.description,
    banner_url    : parsed.data.banner_url,
    banner_width  : parsed.data.banner_width ?? null,
    banner_height : parsed.data.banner_height ?? null,
    password_hash : passwordHash,
    created_at    : '',  // 未使用
    updated_at    : '',  // 未使用
    is_deleted    : parsed.data.is_deleted
  });
  
  await new SiteTagService().replaceNames(new SiteTagsRepository(context.env.DB), new TagsRepository(context.env.DB), idParsed.data, parsed.data.tags);
  
  return context.json({ result: true }, httpStatusCode.ok);
});

adminSites.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const adminSitesRepository = new AdminSitesRepository(context.env.DB);
  
  const existing = await adminSitesRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  await new SiteTagsRepository(context.env.DB).deleteBySiteId(idParsed.data);
  await adminSitesRepository.deleteById(idParsed.data);
  
  return context.body(null, httpStatusCode.noContent);
});
