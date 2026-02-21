import { ManagedRuntime } from 'effect';

import { API_ID } from '../lib/consts.js';
import { layerLive } from './layerLive.js';

export const runtimeLive = ManagedRuntime.make(layerLive(API_ID));

export type RuntimeLive = typeof runtimeLive;
