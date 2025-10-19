import { handle } from 'hono/aws-lambda';

import { app } from './hono-app.js';

export const handler = handle(app);
