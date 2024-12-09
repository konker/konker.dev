import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import { toCacheError } from '../error';
import type { CacheKeyResolver } from './index';

export const JsonCacheKeyResolver =
  <I>(): CacheKeyResolver<I> =>
  (i: I) =>
    pipe(i, Schema.encode(Schema.parseJson()), Effect.mapError(toCacheError));
