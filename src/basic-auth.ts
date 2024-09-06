import * as P from '@konker.dev/effect-ts-prelude';

import type { NonEmptyArray } from 'effect/Array';

export type BasicAuth = {
  readonly username: string;
  readonly password: string;
};

export function decodeBasicAuthToken(basicAuthToken: string): P.Effect.Effect<BasicAuth, Error> {
  return P.pipe(
    basicAuthToken,
    P.Schema.decode(P.Schema.StringFromBase64),
    P.Effect.flatMap((decoded) => {
      const parts = decoded.split(':');
      return P.Effect.if(parts.length === 2, {
        onTrue: () =>
          P.Effect.succeed({
            username: parts[0]!,
            password: parts[1]!,
          }),
        onFalse: () => P.Effect.fail(new Error('Invalid basic auth payload')),
      });
    })
  );
}

export const validateBasicAuthPassword =
  (passwords: NonEmptyArray<string>) =>
  (basicAuth: BasicAuth): P.Effect.Effect<boolean> => {
    return P.Effect.succeed(passwords.includes(basicAuth.password));
  };
