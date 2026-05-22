import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { idParamSchema } from '../../../../shared/schemas/id-param-schema';
import { SitesRepository } from '../../../repositories/sites-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const adminSites = new Hono<{ Bindings: HonoBindings; }>();
export const adminSitesPath = '/sites';

adminSites.use((context, next) => jwt({ secret: context.env.ADMIN_JWT_SECRET, alg: 'HS256' })(context, next));

adminSites.get('/', async context => {
  const result = await new SitesRepository(context.env.DB).findAll();
  return context.json({ result }, httpStatusCode.ok);
});

adminSites.delete('/:id', async context => {  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing
  const idParsed = idParamSchema.safeParse(context.req.param('id'));
  if(!idParsed.success) return context.json({ error: 'ID パラメータが不正です' }, httpStatusCode.badRequest);
  
  const sitesRepository = new SitesRepository(context.env.DB);
  const existing = await sitesRepository.findAuthById(idParsed.data);
  if(existing == null) return context.json({ error: '対象のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  await sitesRepository.markDeleted(idParsed.data);
  return context.body(null, httpStatusCode.noContent);
});
