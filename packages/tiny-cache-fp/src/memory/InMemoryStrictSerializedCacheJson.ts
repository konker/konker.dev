import * as P from '@konker.dev/effect-ts-prelude';

import { InMemoryCache } from './InMemoryCache';
import { InMemoryStrictSerializedCache } from './InMemoryStrictSerializedCache';

export const TAG = 'InMemoryStrictSerializedCacheJson';

export type InMemoryStrictSerializedCacheJson<V> = InMemoryStrictSerializedCache<V>;
export const InMemoryStrictSerializedCacheJson = <V>(s: P.Schema.Schema<V>) =>
  InMemoryStrictSerializedCache<V, string>(InMemoryCache<string>(), P.Schema.parseJson(s));
