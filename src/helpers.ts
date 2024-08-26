import * as P from '@konker.dev/effect-ts-prelude';

export function extractToken(authorization?: string): P.Effect.Effect<string, Error> {
  const BEARER_RE = /^Bearer (\S+)$/;
  const match = authorization?.match(BEARER_RE);

  return match?.[1] ? P.Effect.succeed(match?.[1]) : P.Effect.fail(new Error('No token found'));
}
