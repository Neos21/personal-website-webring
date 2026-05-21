import { Hono } from 'hono';

import { comments, commentsPath } from './comments/comments';

import type { HonoBindings } from '../../../types/hono-bindings';

export const sites = new Hono<{ Bindings: HonoBindings; }>();
export const sitesPath = '/sites';

sites.route('/:id' + commentsPath, comments);  // eslint-disable-line neos-eslint-plugin/comment-colon-spacing

sites.get('/', async context => {
  return context.json({ result: 'TODO' }, 200);
});
