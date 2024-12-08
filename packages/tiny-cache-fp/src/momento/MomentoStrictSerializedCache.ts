import type * as P from '@konker.dev/effect-ts-prelude';
import type { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';

import { StrictSerializedCache } from '../StrictSerializedCache';
import type { MomentoStringCache } from './MomentoStringCache';

export const TAG = 'MomentoStrictSerializedCache';

export type MomentoStrictSerializedCache<V> = StrictSerializedCache<V, MomentoClientDeps>;
export const MomentoStrictSerializedCache = <V>(
  cache: MomentoStringCache,
  s: P.Schema.Schema<V, string>
): MomentoStrictSerializedCache<V> => StrictSerializedCache(cache, s);
