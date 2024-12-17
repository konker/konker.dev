import * as Effect from 'effect/Effect';

import type { CacheKeyResolver } from './index.js';

export const DefaultCacheKeyResolver =
  <I>(): CacheKeyResolver<I> =>
  (i: I) =>
    Effect.succeed(String(i));
