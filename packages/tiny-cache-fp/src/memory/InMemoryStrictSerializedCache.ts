import type * as P from '@konker.dev/effect-ts-prelude';

import { StrictSerializedCache } from '../StrictSerializedCache';
import type { InMemoryCache } from './InMemoryCache';

export const TAG = 'InMemoryStrictSerializedCache';

export type InMemoryStrictSerializedCache<V> = StrictSerializedCache<V, never>;
export const InMemoryStrictSerializedCache = <V, C>(
  cache: InMemoryCache<C>,
  s: P.Schema.Schema<V, C>
): InMemoryStrictSerializedCache<V> => StrictSerializedCache(cache, s);
