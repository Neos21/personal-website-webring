import { Hono } from 'hono';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { convertToPositiveInteger } from '../../../../shared/helpers/convert-to-positive-integer';
import { SitesRepository } from '../../../repositories/sites-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const random = new Hono<{ Bindings: HonoBindings; }>();
export const randomPath = '/random';

random.get('/', async context => {
  const id = convertToPositiveInteger(context.req.query('id'));
  
  const site = await new SitesRepository(context.env.DB).findRandom(id);
  if(site == null) return context.json({ error: '遷移先のサイトが見つかりませんでした' }, httpStatusCode.notFound);
  
  return context.json({ result: site }, httpStatusCode.ok);
});
