import * as crypto from 'node:crypto';

import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { CacheError } from '../error.js';
import { toCacheError } from '../error.js';
import type { CacheKeyResolver } from './index.js';

export const md5String = (s: string): Effect.Effect<string, CacheError> =>
  Effect.try({
    try: () => crypto.createHash('md5').update(s).digest('hex'),
    catch: toCacheError,
  });

export const JsonHashCacheKeyResolver =
  <I>(): CacheKeyResolver<I> =>
  (i: I) =>
    pipe(i, Schema.encode(Schema.parseJson()), Effect.mapError(toCacheError), Effect.flatMap(md5String));
