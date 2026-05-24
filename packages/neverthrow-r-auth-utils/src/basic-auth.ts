import { fromResult, type ResultR } from '@konker.dev/neverthrow-r';
import { err, ok, type Result } from 'neverthrow';

export const BASIC_AUTH_WILDCARD_USERNAME = '*';

export type BasicAuthCredentials = {
  readonly username: string;
  readonly password: string;
};

export type NonEmptyStringArray = readonly [string, ...Array<string>];

export type ValidBasicAuthCredentials = {
  readonly username: string;
  readonly passwords: NonEmptyStringArray;
};

export type ValidBasicAuthCredentialSet = Array<ValidBasicAuthCredentials>;

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

export const basicAuthCredentialMatch = (basicAuth: BasicAuthCredentials) => (valid: ValidBasicAuthCredentials) =>
  (valid.username === BASIC_AUTH_WILDCARD_USERNAME || valid.username === basicAuth.username) &&
  valid.passwords.includes(basicAuth.password);

function decodeBase64String(value: string | undefined): Result<string, Error> {
  const base64Re = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (!value || !base64Re.test(value)) {
    return err(new Error('Invalid base64 input'));
  }

  return ok(Buffer.from(value, 'base64').toString('utf8'));
}

export function basicAuthDecodeHeaderValue(
  basicAuthHeaderValue: string | undefined
): ResultR<unknown, BasicAuthCredentials, Error> {
  return fromResult(
    decodeBase64String(basicAuthHeaderValue).andThen((decoded: string) => {
      const parts = decoded.split(':');

      return parts.length === 2
        ? ok({
            username: parts[0]!,
            password: parts[1]!,
          })
        : err(new Error('Invalid basic auth payload'));
    })
  );
}

export function basicAuthEncodeHeaderValue(
  basicAuthCredentials: BasicAuthCredentials
): ResultR<unknown, string, never> {
  return fromResult(
    ok(
      `Basic ${Buffer.from(`${basicAuthCredentials.username}:${basicAuthCredentials.password}`, 'utf8').toString('base64')}`
    )
  );
}

export const basicAuthVerifyCredentials =
  (valid: ValidBasicAuthCredentialSet) =>
  (basicAuth: BasicAuthCredentials): ResultR<unknown, BasicAuthUserContext, never> =>
    fromResult(
      ok(
        valid.some(basicAuthCredentialMatch(basicAuth))
          ? BasicAuthUserContext(true, basicAuth.username)
          : BasicAuthUserContext(false)
      )
    );
