import { Hono } from 'hono';

import { httpStatusCode } from '../../../../shared/constants/http-status-code';
import { CountersRepository } from '../../../repositories/counters-repository';

import type { HonoBindings } from '../../../types/hono-bindings';

export const counters = new Hono<{ Bindings: HonoBindings; }>();
export const countersPath = '/counters';

counters.get('/', async context => {
  const rawCounter = await new CountersRepository(context.env.DB).find();
  const counter = rawCounter == null ? 0 : rawCounter.counter;
  return context.json({ result: counter }, httpStatusCode.ok);
});

counters.post('/', async context => {
  await new CountersRepository(context.env.DB).update();
  return context.body(null, httpStatusCode.noContent);
});
