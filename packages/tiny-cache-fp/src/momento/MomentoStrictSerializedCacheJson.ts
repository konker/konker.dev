import * as P from '@konker.dev/effect-ts-prelude';

import { MomentoStrictSerializedCache } from './MomentoStrictSerializedCache';
import { MomentoStringCache } from './MomentoStringCache';

export const TAG = 'MomentoStrictSerializedCacheJson';

export type MomentoStrictSerializedCacheJson<V> = MomentoStrictSerializedCache<V>;
export const MomentoStrictSerializedCacheJson = <V>(s: P.Schema.Schema<V>): MomentoStrictSerializedCacheJson<V> =>
  MomentoStrictSerializedCache(MomentoStringCache, P.Schema.parseJson(s));
