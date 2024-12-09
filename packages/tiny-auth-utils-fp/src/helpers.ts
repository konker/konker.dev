import * as Effect from 'effect/Effect';

export function extractBearerToken(authorization?: string): Effect.Effect<string, Error> {
  const BEARER_RE = /^Bearer (\S+)$/;
  const match = authorization?.match(BEARER_RE);

  return match?.[1] ? Effect.succeed(match?.[1]) : Effect.fail(new Error('No token found'));
}

export function extractBasicAuthHeaderValue(authorization?: string): Effect.Effect<string, Error> {
  const BASIC_AUTH_RE = /^Basic (\S+)$/;
  const match = authorization?.match(BASIC_AUTH_RE);

  return match?.[1] ? Effect.succeed(match?.[1]) : Effect.fail(new Error('No token found'));
}
