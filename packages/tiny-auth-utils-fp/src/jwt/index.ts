import { toError } from '@konker.dev/tiny-error-fp/lib';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import * as jwt from 'jsonwebtoken';

import type { JwtPayloadSubIss } from './common.js';
import { checkJwtPayloadIssSub, JwtUserContext } from './common.js';

// --------------------------------------------------------------------------
export type JwtSigningConfig = {
  signingSecret: string;
  issuer: string;
  maxTtlSec: number;
};
export type JwtVerificationConfig = {
  signingSecret: string;
  issuer: string;
};

// --------------------------------------------------------------------------
export function jwtDecodeToken(token: string): Effect.Effect<jwt.JwtPayload, Error> {
  return pipe(
    Effect.try({
      try: () => jwt.decode(token),
      catch: toError,
    }),
    Effect.flatMap((decoded) =>
      !decoded || typeof decoded === 'string'
        ? Effect.fail(new Error('Invalid token payload'))
        : Effect.succeed(decoded)
    )
  );
}

// --------------------------------------------------------------------------
export function jwtSignToken(payload: jwt.JwtPayload, config: JwtSigningConfig): Effect.Effect<string, Error> {
  return Effect.try({
    try: () =>
      jwt.sign(payload, config.signingSecret, {
        issuer: config.issuer,
        expiresIn: config.maxTtlSec,
      }),
    catch: toError,
  });
}

// --------------------------------------------------------------------------
export function jwtVerifyToken(token: string, config: JwtVerificationConfig): Effect.Effect<JwtUserContext> {
  return pipe(
    Effect.try({
      try: () =>
        jwt.verify(token, config.signingSecret, {
          issuer: config.issuer,
          // [FIXME: make this configurable?]
          // maxAge: config.maxTtlSec,
        }),
      catch: toError,
    }),
    Effect.flatMap(checkJwtPayloadIssSub),
    Effect.map((jwtPayload: JwtPayloadSubIss) => JwtUserContext(true, jwtPayload)),
    Effect.orElse(() => Effect.succeed(JwtUserContext(false)))
  );
}
