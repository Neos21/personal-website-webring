import { Hono } from 'hono';

import { httpStatusCode } from '../../../shared/constants/http-status-code';
import { convertToPositiveInteger } from '../../helpers/convert-to-positive-integer';
import { SitesRepository } from '../../repositories/sites-repository';

import type { HonoBindings } from '../../types/hono-bindings';

export const next = new Hono<{ Bindings: HonoBindings; }>();
export const nextPath = '/next';

next.get('/', async context => {
  const id = convertToPositiveInteger(context.req.query('id'));
  if(id == null) return context.json({ error: 'ID が指定されていません' }, httpStatusCode.badRequest);
  
  const site = await new SitesRepository(context.env.DB).findNext(id);
  if(site == null) return context.json({ error: '次のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  return context.redirect(site.url);
});
