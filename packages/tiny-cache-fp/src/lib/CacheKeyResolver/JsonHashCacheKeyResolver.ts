import * as P from '@konker.dev/effect-ts-prelude';

import crypto from 'node:crypto';

import type { CacheError } from '../error';
import { toCacheError } from '../error';
import type { CacheKeyResolver } from './index';

export const md5String = (s: string): P.Effect.Effect<string, CacheError> =>
  P.Effect.try({
    try: () => crypto.createHash('md5').update(s).digest('hex'),
    catch: toCacheError,
  });

export const JsonHashCacheKeyResolver =
  <I>(): CacheKeyResolver<I> =>
  (i: I) =>
    P.pipe(i, P.Schema.encode(P.Schema.parseJson()), P.Effect.mapError(toCacheError), P.Effect.flatMap(md5String));
