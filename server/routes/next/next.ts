import { Hono } from 'hono';

import { httpStatusCode } from '../../../shared/constants/http-status-code';
import { convertToInteger } from '../../helpers/convert-to-integer';
import { WebringRepository } from '../../repositories/webring-repository';

import type { HonoBindings } from '../../types/hono-bindings';

export const next = new Hono<{ Bindings: HonoBindings; }>();
export const nextPath = '/next';

next.get('/', async context => {
  const id = convertToInteger(context.req.query('id'));
  if(id == null) return context.json({ error: 'ID が指定されていません' }, httpStatusCode.badRequest);
  
  const webringRepository = new WebringRepository(context.env.DB);
  const site = await webringRepository.getNextSite(id);
  if(site == null) return context.json({ error: '次のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  return context.redirect(site.url);
});
