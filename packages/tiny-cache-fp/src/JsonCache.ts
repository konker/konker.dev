import { Schema } from 'effect';

import type { Cache } from './Cache.js';
import { StrictSerializedCache } from './StrictSerializedCache.js';

export const JsonCache = <R = never>(cache: Cache<string, R>): Cache<unknown, R> =>
  StrictSerializedCache<unknown, string, R>(cache, Schema.parseJson());
