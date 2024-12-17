import type * as Effect from 'effect/Effect';

import type { CacheError } from '../error.js';

export type CacheKeyResolver<I, R = never> = (i: I) => Effect.Effect<string, CacheError, R>;
