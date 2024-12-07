import * as P from '@konker.dev/effect-ts-prelude';
import type { NonEmptyArray } from 'effect/Array';

// --------------------------------------------------------------------------
export const BASIC_AUTH_WILDCARD_USERNAME = '*';

export type BasicAuthCredentials = {
  readonly username: string;
  readonly password: string;
};

export type ValidBasicAuthCredentials = {
  readonly username: string;
  readonly passwords: NonEmptyArray<string>;
};
export type ValidBasicAuthCredentialSet = Array<ValidBasicAuthCredentials>;

// --------------------------------------------------------------------------
export type BasicAuthUserContext =
  | { readonly verified: false }
  | {
      readonly verified: true;
      readonly userId?: string;
    };

export function BasicAuthUserContext(verified: false): BasicAuthUserContext;
export function BasicAuthUserContext(verified: true, userId: string): BasicAuthUserContext;
export function BasicAuthUserContext(verified: boolean, userId?: string): BasicAuthUserContext {
  return verified
    ? userId !== undefined && userId !== ''
      ? { verified: true, userId }
      : { verified: true }
    : { verified: false };
}

// --------------------------------------------------------------------------
export const basicAuthCredentialMatch = (basicAuth: BasicAuthCredentials) => (valid: ValidBasicAuthCredentials) =>
  (valid.username === BASIC_AUTH_WILDCARD_USERNAME || valid.username === basicAuth.username) &&
  valid.passwords.includes(basicAuth.password);

// --------------------------------------------------------------------------
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

// --------------------------------------------------------------------------
export const basicAuthVerifyCredentials =
  (valid: ValidBasicAuthCredentialSet) =>
  (basicAuth: BasicAuthCredentials): P.Effect.Effect<BasicAuthUserContext> => {
    return P.Effect.if(valid.some(basicAuthCredentialMatch(basicAuth)), {
      onTrue: () => P.Effect.succeed(BasicAuthUserContext(true, basicAuth.username)),
      onFalse: () => P.Effect.succeed(BasicAuthUserContext(false)),
    });
  };
