import { Hono } from 'hono';

import { handler } from '../api/root/handler.js';
import { API_ID, VERSION } from '../lib/consts.js';

export const app = new Hono()
  .get('/', (c) => {
    return handler(c.req);
  })
  .get('/ping', (c) => {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: VERSION,
      apiId: API_ID,
    });
  });
