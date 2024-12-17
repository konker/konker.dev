import type { Schema } from 'effect';

import { StrictSerializedCache } from '../StrictSerializedCache.js';
import type { InMemoryCache } from './InMemoryCache.js';

export type InMemoryStrictSerializedCache<V> = StrictSerializedCache<V, never>;
export const InMemoryStrictSerializedCache = <V, C>(
  cache: InMemoryCache<C>,
  s: Schema.Schema<V, C>
): InMemoryStrictSerializedCache<V> => StrictSerializedCache(cache, s);
