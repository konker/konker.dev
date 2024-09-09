import * as P from '@konker.dev/effect-ts-prelude';

import type { NonEmptyArray } from 'effect/Array';

export type BasicAuthCredentials = {
  readonly username?: string;
  readonly password: string;
};

export type ValidBasicAuthCredentials = Array<{
  readonly username?: string;
  readonly passwords: NonEmptyArray<string>;
}>;

export function basicAuthDecodeHeaderValue(
  basicAuthHeaderValue: string | undefined
): P.Effect.Effect<BasicAuthCredentials, Error> {
  return P.pipe(
    basicAuthHeaderValue,
    P.Schema.decodeUnknown(P.Schema.StringFromBase64),
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

export const basicAuthValidateCredentials =
  (valid: ValidBasicAuthCredentials) =>
  (basicAuth: BasicAuthCredentials): P.Effect.Effect<boolean> => {
    return P.Effect.succeed(
      valid.some((x) => (!x.username || x.username === basicAuth.username) && x.passwords.includes(basicAuth.password))
    );
  };
