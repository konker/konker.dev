import { ManagedRuntime } from 'effect';

import { layerTest } from './layerTest.js';

export const runtimeTest = (env: Record<string, string>, responseData: Array<unknown>) =>
  ManagedRuntime.make(layerTest('backend-boilerplate-test', env, responseData));
export type RuntimeTest = ReturnType<typeof runtimeTest>;
