import * as P from '@konker.dev/effect-ts-prelude';

export function extractBearerToken(authorization?: string): P.Effect.Effect<string, Error> {
  const BEARER_RE = /^Bearer (\S+)$/;
  const match = authorization?.match(BEARER_RE);

  return match?.[1] ? P.Effect.succeed(match?.[1]) : P.Effect.fail(new Error('No token found'));
}

export function basicAuthExtractEncoded(authorization?: string): P.Effect.Effect<string, Error> {
  const BASIC_AUTH_RE = /^Basic (\S+)$/;
  const match = authorization?.match(BASIC_AUTH_RE);

  return match?.[1] ? P.Effect.succeed(match?.[1]) : P.Effect.fail(new Error('No token found'));
}
