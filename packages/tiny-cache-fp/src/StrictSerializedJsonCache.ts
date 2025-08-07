import { Schema } from 'effect';

import { StrictSerializedCache } from './StrictSerializedCache.js';
import type { TinyCache } from './TinyCache.js';

export const StrictSerializedJsonCache = <V, C, R = never>(
  cache: TinyCache<string, R>,
  schema: Schema.Schema<V, C>
): TinyCache<V, R> => StrictSerializedCache<V, string, R>(cache, Schema.parseJson(schema));
