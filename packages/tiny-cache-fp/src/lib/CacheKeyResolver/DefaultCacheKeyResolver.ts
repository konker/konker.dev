import * as P from '@konker.dev/effect-ts-prelude';

import type { CacheKeyResolver } from './index';

export const DefaultCacheKeyResolver =
  <I>(): CacheKeyResolver<I> =>
  (i: I) =>
    P.Effect.succeed(String(i));
