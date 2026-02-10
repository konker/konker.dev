import { ManagedRuntime } from 'effect';

import { layerLive } from './layerLive.js';

export const runtimeTest = ManagedRuntime.make(layerLive('backend-boilerplate'));
export type RuntimeTest = typeof runtimeTest;
