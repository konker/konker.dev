import type { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import type { Schema } from 'effect';

import { StrictSerializedCache } from '../StrictSerializedCache';
import type { MomentoStringCache } from './MomentoStringCache';

export const TAG = 'MomentoStrictSerializedCache';

export type MomentoStrictSerializedCache<V> = StrictSerializedCache<V, MomentoClientDeps>;
export const MomentoStrictSerializedCache = <V>(
  cache: MomentoStringCache,
  s: Schema.Schema<V, string>
): MomentoStrictSerializedCache<V> => StrictSerializedCache(cache, s);
