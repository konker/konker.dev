import { ManagedRuntime } from 'effect';

import { liveLayer } from './liveLayer';

export const runtimeLive = ManagedRuntime.make(liveLayer('backend-boilerplate'));
export type RuntimeLive = typeof runtimeLive;
