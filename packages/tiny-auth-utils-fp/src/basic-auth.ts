import { pipe, Schema } from 'effect';
import type { NonEmptyArray } from 'effect/Array';
import * as Effect from 'effect/Effect';

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
): Effect.Effect<BasicAuthCredentials, Error> {
  return pipe(
    basicAuthHeaderValue,
    Schema.decodeUnknown(Schema.StringFromBase64),
    Effect.flatMap((decoded) => {
      const parts = decoded.split(':');
      return Effect.if(parts.length === 2, {
        onTrue: () =>
          Effect.succeed({
            username: parts[0]!,
            password: parts[1]!,
          }),
        onFalse: () => Effect.fail(new Error('Invalid basic auth payload')),
      });
    })
  );
}

// --------------------------------------------------------------------------
export function basicAuthEncodeHeaderValue(basicAuthCredentials: BasicAuthCredentials): Effect.Effect<string, Error> {
  return pipe(
    `${basicAuthCredentials.username}:${basicAuthCredentials.password}`,
    Schema.encode(Schema.StringFromBase64),
    Effect.map((encoded) => `Basic ${encoded}`)
  );
}

// --------------------------------------------------------------------------
export const basicAuthVerifyCredentials =
  (valid: ValidBasicAuthCredentialSet) =>
  (basicAuth: BasicAuthCredentials): Effect.Effect<BasicAuthUserContext> => {
    return Effect.if(valid.some(basicAuthCredentialMatch(basicAuth)), {
      onTrue: () => Effect.succeed(BasicAuthUserContext(true, basicAuth.username)),
      onFalse: () => Effect.succeed(BasicAuthUserContext(false)),
    });
  };
