import type { ManagedRuntime } from 'effect';
import { Hono } from 'hono';

import { handler as fooHandlerCtor } from '../api/foo/handler.js';
import { handler as rootHandlerCtor } from '../api/root/handler.js';
import { API_ID, VERSION } from '../lib/consts.js';

export const app = <R, ER>(runtime: ManagedRuntime.ManagedRuntime<R, ER>) => {
  const rootHandler = rootHandlerCtor(runtime);
  const fooHandler = fooHandlerCtor(runtime);

  return new Hono()
    .get('/', (c) => {
      return rootHandler(c.req);
    })
    .get('/foo', (c) => {
      return fooHandler(c.req);
    })
    .get('/ping', (c) => {
      return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: VERSION,
        apiId: API_ID,
      });
    });
};
