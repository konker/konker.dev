import { ManagedRuntime } from 'effect';

import { API_ID } from '../lib/consts.js';
import { layerTest } from './layerTest.js';

export const runtimeTest = (env: Record<string, string>, responseData: Array<unknown>) =>
  ManagedRuntime.make(layerTest(API_ID, env, responseData));

export type RuntimeTest = ReturnType<typeof runtimeTest>;
