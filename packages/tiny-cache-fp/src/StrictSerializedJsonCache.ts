import { Schema } from 'effect';

import type { Cache } from './Cache.js';
import { StrictSerializedCache } from './StrictSerializedCache.js';

export const StrictSerializedJsonCache = <V, C, R = never>(
  cache: Cache<string, R>,
  schema: Schema.Schema<V, C>
): Cache<V, R> => StrictSerializedCache<V, string, R>(cache, Schema.parseJson(schema));
