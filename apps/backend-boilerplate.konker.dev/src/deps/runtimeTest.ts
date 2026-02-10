import { ManagedRuntime } from 'effect';

import { layerTest } from './layerTest.js';

export const runtimeTest = (responseData: Array<unknown>) =>
  ManagedRuntime.make(layerTest('backend-boilerplate-test', responseData));
export type RuntimeTest = ReturnType<typeof runtimeTest>;
