import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { adminConstants } from '../../../../shared/constants/admin';
import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { convertToInteger } from '../../../helpers/convert-to-integer';
import { TagsRepository } from '../../../repositories/tags-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminTags = new Hono<{ Bindings: HonoBindings; }>();
export const adminTagsPath = '/tags';

adminTags.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminTags.get('/', async context => {
  const page = convertToInteger(context.req.query('page')) ?? 1;
  const offset = (page - 1) * adminConstants.tagsPageSize;
  const tags = await new TagsRepository(context.env.DB).findPage(adminConstants.tagsPageSize + 1, offset);
  const hasNext = tags.length > adminConstants.tagsPageSize;
  if(hasNext) tags.length = adminConstants.tagsPageSize;
  
  return context.json({ result: { page, tags, has_next: hasNext } }, httpStatusCode.ok);
});
