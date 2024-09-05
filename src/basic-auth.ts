import * as P from '@konker.dev/effect-ts-prelude';

import type { NonEmptyArray } from 'effect/Array';

export const validateBasicAuthToken =
  (secrets: NonEmptyArray<string>) =>
  (basicAuthToken: string): P.Effect.Effect<boolean> => {
    return P.Effect.succeed(secrets.includes(basicAuthToken));
  };
