/* eslint-disable fp/no-unused-expression */
import { serve } from '@hono/node-server';

import { app } from './hono-app.js';

const server = serve(app);

// graceful shutdown
process.on('SIGINT', () => {
  server.close();
  return process.exit(0);
});
process.on('SIGTERM', () => {
  return server.close((err) => {
    if (err) {
      console.error(err);
      return process.exit(1);
    }
    return process.exit(0);
  });
});
