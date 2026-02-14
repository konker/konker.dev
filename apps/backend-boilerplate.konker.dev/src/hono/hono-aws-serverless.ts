import { handle } from 'hono/aws-lambda';

import { runtimeLive } from '../deps/runtimeLive.js';
import { app } from './hono-app.js';

// --------------------------------------------------------------------------
export const handler = handle(app(runtimeLive));
