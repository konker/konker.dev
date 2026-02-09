import { ManagedRuntime } from 'effect';

import { liveLayer } from './liveLayer';

export const runtimeTest = ManagedRuntime.make(liveLayer('backend-boilerplate'));
export type RuntimeTest = typeof runtimeTest;
