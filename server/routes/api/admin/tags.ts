import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { adminConstants } from '../../../../shared/constants/admin';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { adminNewTagSchema } from '../../../../shared/schemas/admin/admin-tag-schema';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { AdminSiteTagsRepository } from '../../../repositories/admin/admin-site-tags-repository';
import { AdminTagsRepository } from '../../../repositories/admin/admin-tags-repository';
import { TagsRepository } from '../../../repositories/tags-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminTags = new Hono<{ Bindings: HonoBindings; }>();
export const adminTagsPath = '/tags';

adminTags.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminTags.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * adminConstants.tagsPageSize;
  
  const tags = await new AdminTagsRepository(context.env.DB).findPage(adminConstants.tagsPageSize + 1, offset);
  const hasNext = tags.length > adminConstants.tagsPageSize;
  if(hasNext) tags.length = adminConstants.tagsPageSize;
  return context.json({ result: { page, tags, has_next: hasNext } }, httpStatusCode.ok);
});

adminTags.post('/', async context => {
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminNewTagSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const tagsRepository = new TagsRepository(context.env.DB);
  const existing = await tagsRepository.findByNameCaseInsensitive(parsed.data.name);
  if(existing != null) return context.json({ error: 'このタグ名は既に登録されています' }, httpStatusCode.badRequest);
  
  const id = await tagsRepository.create(parsed.data.name);
  return context.json({ result: { id } }, httpStatusCode.created);
});

adminTags.put('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const body = await context.req.json().catch(() => null);
  if(body == null) return context.json({ error: 'リクエストボディが不正です' }, httpStatusCode.badRequest);
  
  const parsed = adminNewTagSchema.safeParse(body);
  if(!parsed.success) return context.json({ error: mergeIssues(parsed.error) }, httpStatusCode.badRequest);
  
  const adminTagsRepository = new AdminTagsRepository(context.env.DB);
  const existing = await adminTagsRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のタグが見つかりませんでした' }, httpStatusCode.notFound);
  
  const duplicate = await new TagsRepository(context.env.DB).findByNameCaseInsensitive(parsed.data.name);
  if(duplicate != null && duplicate.id !== idParsed.data) return context.json({ error: 'このタグ名は既に登録されています' }, httpStatusCode.badRequest);
  
  await adminTagsRepository.updateById(idParsed.data, parsed.data.name);
  return context.json({ result: true }, httpStatusCode.ok);
});

adminTags.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const adminTagsRepository = new AdminTagsRepository(context.env.DB);
  const existing = await adminTagsRepository.findById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のタグが見つかりませんでした' }, httpStatusCode.notFound);
  
  const siteCount = await new AdminSiteTagsRepository(context.env.DB).countSitesByTagId(idParsed.data);
  if(siteCount > 0) return context.json({ error: 'このタグはサイトに紐付いているため削除できません' }, httpStatusCode.badRequest);
  
  await adminTagsRepository.deleteById(idParsed.data);
  return context.body(null, httpStatusCode.noContent);
});
