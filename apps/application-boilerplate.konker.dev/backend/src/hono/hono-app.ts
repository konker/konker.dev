import { Hono } from 'hono';

import { handler as fooHandlerCtor } from '../api/foo/handler.js';
import { handler as rootHandlerCtor } from '../api/root/handler.js';
import { handler as zeroMutateHandlerCtor } from '../api/zero-mutate/handler.js';
import { handler as zeroQueryHandlerCtor } from '../api/zero-query/handler.js';
import type { RuntimeLive } from '../deps/runtimeLive.js';
import { API_ID, VERSION } from '../lib/consts.js';

export const app = (runtime: RuntimeLive) => {
  const rootHandler = rootHandlerCtor(runtime);
  const fooHandler = fooHandlerCtor(runtime);
  const zeroQueryHandler = zeroQueryHandlerCtor(runtime);
  const zeroMutateHandler = zeroMutateHandlerCtor(runtime);

  return new Hono()
    .get('/', async (c) => {
      return rootHandler(c.req);
    })
    .get('/foo', async (c) => {
      return fooHandler(c.req);
    })
    .post('/zero/query', async (c) => {
      return zeroQueryHandler(c.req);
    })
    .post('/zero/mutate', async (c) => {
      return zeroMutateHandler(c.req);
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
