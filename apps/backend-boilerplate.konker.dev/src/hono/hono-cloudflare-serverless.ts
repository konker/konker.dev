import { Layer, ManagedRuntime } from 'effect';

import { app } from './hono-app.js';

const runtime = ManagedRuntime.make(Layer.empty);

// No need for anything extra
export const handler = app(runtime);
