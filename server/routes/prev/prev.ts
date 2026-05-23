import { Hono } from 'hono';

import { httpStatusCode } from '../../../shared/constants/http-status-code';
import { convertToPositiveInteger } from '../../../shared/helpers/convert-to-positive-integer';
import { SitesRepository } from '../../repositories/sites-repository';

import type { HonoBindings } from '../../types/hono-bindings';

export const prev = new Hono<{ Bindings: HonoBindings; }>();
export const prevPath = '/prev';

prev.get('/', async context => {
  const id = convertToPositiveInteger(context.req.query('id'));
  if(id == null) return context.json({ error: 'ID が指定されていません' }, httpStatusCode.badRequest);
  
  const site = await new SitesRepository(context.env.DB).findPrev(id);
  if(site == null) return context.json({ error: '前のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  return context.redirect(site.url);
});
