import { Layer, ManagedRuntime } from 'effect';
import { handle } from 'hono/aws-lambda';

import { app } from './hono-app.js';

const runtime = ManagedRuntime.make(Layer.empty);

export const handler = handle(app(runtime));
