import { Hono } from 'hono';

import { handler } from '../api/root/handler.js';

export const app = new Hono().get('/', (c) => {
  return handler(c.req);
});
