import { Schema } from 'effect';

import { InMemoryCache } from './InMemoryCache';
import { InMemoryStrictSerializedCache } from './InMemoryStrictSerializedCache';

export const TAG = 'InMemoryStrictSerializedCacheJson';

export type InMemoryStrictSerializedCacheJson<V> = InMemoryStrictSerializedCache<V>;
export const InMemoryStrictSerializedCacheJson = <V>(s: Schema.Schema<V>) =>
  InMemoryStrictSerializedCache<V, string>(InMemoryCache<string>(), Schema.parseJson(s));
