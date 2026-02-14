import { ManagedRuntime } from 'effect';

import { layerLive } from './layerLive.js';

export const runtimeLive = ManagedRuntime.make(layerLive('backend-boilerplate'));
export type RuntimeLive = typeof runtimeLive;
