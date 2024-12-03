import * as P from '@konker.dev/effect-ts-prelude';

import { toCacheError } from '../error';
import type { CacheKeyResolver } from './index';

export const JsonCacheKeyResolver =
  <I>(): CacheKeyResolver<I> =>
  (i: I) =>
    P.pipe(i, P.Schema.encode(P.Schema.parseJson()), P.Effect.mapError(toCacheError));
