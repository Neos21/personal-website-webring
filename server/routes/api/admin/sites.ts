import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { z } from 'zod';

import { adminConstants } from '../../../../shared/constants/admin';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { updateSiteSchema } from '../../../../shared/schemas/site-schema';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { SiteTagsRepository } from '../../../repositories/site-tags-repository';
import { SitesRepository } from '../../../repositories/sites-repository';
import { TagsRepository } from '../../../repositories/tags-repository';
import { SiteTagService } from '../../../services/site-tag-service';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminSites = new Hono<{ Bindings: HonoBindings; }>();
export const adminSitesPath = '/sites';

adminSites.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminSites.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * adminConstants.sitesPageSize;
  const sites = await new SitesRepository(context.env.DB).findPage(adminConstants.sitesPageSize + 1, offset);
  const hasNext = sites.length > adminConstants.sitesPageSize;
  if(hasNext) sites.length = adminConstants.sitesPageSize;
  
  return context.json({ result: { page, sites, has_next: hasNext } }, httpStatusCode.ok);
});

const adminUpdateSiteSchema = updateSiteSchema.extend({
  is_deleted: z.union([z.literal(0), z.literal(1)]).optional()
});

adminSites.get('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const site = await new SitesRepository(context.env.DB).findById(idParsed.data);
  if(site == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  const tags = await new SiteTagsRepository(context.env.DB).findBySiteId(idParsed.data);
  
  return context.json({ result: { site, tags } }, httpStatusCode.ok);
});

adminSites.put('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminUpdateSiteSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const sitesRepository = new SitesRepository(context.env.DB);
  const existing = await sitesRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  await sitesRepository.update({
    id: idParsed.data,
    url: parsed.data.url,
    site_name: parsed.data.site_name,
    owner_name: parsed.data.owner_name,
    description: parsed.data.description,
    banner_url: parsed.data.banner_url,
    banner_width: parsed.data.banner_width ?? null,
    banner_height: parsed.data.banner_height ?? null,
    password_hash: parsed.data.password ?? null
  });
  
  if(parsed.data.is_deleted != null && parsed.data.is_deleted !== existing.is_deleted) {
    await sitesRepository.setIsDeleted(idParsed.data, parsed.data.is_deleted);
  }
  
  await new SiteTagService().replaceNames(new SiteTagsRepository(context.env.DB), new TagsRepository(context.env.DB), idParsed.data, parsed.data.tags);
  
  return context.body(null, httpStatusCode.noContent);
});

adminSites.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const sitesRepository = new SitesRepository(context.env.DB);
  const existing = await sitesRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  const siteTagsRepository = new SiteTagsRepository(context.env.DB);
  await siteTagsRepository.deleteBySiteId(idParsed.data);
  await sitesRepository.deleteById(idParsed.data);
  
  return context.body(null, httpStatusCode.noContent);
});
