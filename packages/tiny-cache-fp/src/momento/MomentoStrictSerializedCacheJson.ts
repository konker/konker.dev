import { Schema } from 'effect';

import { MomentoStrictSerializedCache } from './MomentoStrictSerializedCache';
import { MomentoStringCache } from './MomentoStringCache';

export const TAG = 'MomentoStrictSerializedCacheJson';

export type MomentoStrictSerializedCacheJson<V> = MomentoStrictSerializedCache<V>;
export const MomentoStrictSerializedCacheJson = <V>(s: Schema.Schema<V>): MomentoStrictSerializedCacheJson<V> =>
  MomentoStrictSerializedCache(MomentoStringCache, Schema.parseJson(s));
