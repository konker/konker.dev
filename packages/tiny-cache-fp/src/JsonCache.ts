import { Schema } from 'effect';

import { StrictSerializedCache } from './StrictSerializedCache.js';
import type { TinyCache } from './TinyCache.js';

export const JsonCache = <R = never>(cache: TinyCache<string, R>): TinyCache<unknown, R> =>
  StrictSerializedCache<unknown, string, R>(cache, Schema.parseJson());
