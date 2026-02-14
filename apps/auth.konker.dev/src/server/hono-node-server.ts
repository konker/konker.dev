/* eslint-disable fp/no-unused-expression,fp/no-nil */
import { serve } from '@hono/node-server';

import { app } from './hono-app.js';

// --------------------------------------------------------------------------
const port = parseInt(process.env.SERVER_PORT ?? '8787', 10);
const server = serve(
  {
    fetch: app.fetch,
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
  return process.exit(0);
});
process.on('SIGTERM', () => {
  return server.close(async (err) => {
    if (err) {
      console.error(err);
      return process.exit(1);
    }
    return process.exit(0);
  });
});
