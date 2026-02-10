/* eslint-disable fp/no-unused-expression,fp/no-nil */
import { serve } from '@hono/node-server';
import { Effect } from 'effect';

import { runtimeLive } from '../deps/runtimeLive.js';
import { app } from './hono-app.js';

// --------------------------------------------------------------------------
const port = parseInt(process.env.PORT ?? '3000', 10);
const server = serve(
  {
    fetch: app(runtimeLive).fetch,
    port: port,
  },
  (info) => {
    console.log(`Server listening on http://localhost:${info.port}`);
  }
);

// --------------------------------------------------------------------------
// graceful shutdown
process.on('SIGINT', async () => {
  server.close();
  await Effect.runPromise(runtimeLive.disposeEffect);
  return process.exit(0);
});
process.on('SIGTERM', () => {
  return server.close(async (err) => {
    if (err) {
      console.error(err);
      await Effect.runPromise(runtimeLive.disposeEffect);
      return process.exit(1);
    }
    await Effect.runPromise(runtimeLive.disposeEffect);
    return process.exit(0);
  });
});
