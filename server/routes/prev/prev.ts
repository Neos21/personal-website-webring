import { Hono } from 'hono';

import { convertToInteger } from '../../helpers/convert-to-integer';
import { WebringRepository } from '../../repositories/webring-repository';

import type { HonoBindings } from '../../types/hono-bindings';

export const prev = new Hono<{ Bindings: HonoBindings; }>();
export const prevPath = '/prev';

prev.get('/', async context => {
  const id = convertToInteger(context.req.query('id'));
  if(id == null) return context.json({ error: 'ID が指定されていません' }, 400);
  
  const webringRepository = new WebringRepository(context.env.DB);
  const site = await webringRepository.getPrevSite(id);
  if(site == null) return context.json({ error: '前のサイトが見つかりませんでした' }, 500);
  
  return context.redirect(site.url);
});
