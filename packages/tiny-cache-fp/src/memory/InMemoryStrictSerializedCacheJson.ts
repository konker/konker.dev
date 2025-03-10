import { Schema } from 'effect';

import { InMemoryCache } from './InMemoryCache.js';
import { InMemoryStrictSerializedCache } from './InMemoryStrictSerializedCache.js';

export type InMemoryStrictSerializedCacheJson<V> = InMemoryStrictSerializedCache<V>;
export const InMemoryStrictSerializedCacheJson = <V>(s: Schema.Schema<V>) =>
  InMemoryStrictSerializedCache<V, string>(InMemoryCache<string>(), Schema.parseJson(s));
