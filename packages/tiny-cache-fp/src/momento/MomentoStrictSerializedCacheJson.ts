import { Schema } from 'effect';

import { MomentoStrictSerializedCache } from './MomentoStrictSerializedCache.js';
import { MomentoStringCache } from './MomentoStringCache.js';

export type MomentoStrictSerializedCacheJson<V> = MomentoStrictSerializedCache<V>;
export const MomentoStrictSerializedCacheJson = <V>(s: Schema.Schema<V>): MomentoStrictSerializedCacheJson<V> =>
  MomentoStrictSerializedCache(MomentoStringCache, Schema.parseJson(s));
