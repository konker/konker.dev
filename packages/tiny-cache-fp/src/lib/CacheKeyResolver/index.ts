import type * as P from '@konker.dev/effect-ts-prelude';

import type { CacheError } from '../error';

export type CacheKeyResolver<I, R = never> = (i: I) => P.Effect.Effect<string, CacheError, R>;
