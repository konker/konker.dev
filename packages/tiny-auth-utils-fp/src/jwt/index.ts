import * as P from '@konker.dev/effect-ts-prelude';

import * as jwt from 'jsonwebtoken';

import type { JwtPayloadSubIss } from './common';
import { checkJwtPayloadIssSub, JwtUserContext } from './common';

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
export function jwtDecodeToken(token: string): P.Effect.Effect<jwt.JwtPayload, Error> {
  return P.pipe(
    P.Effect.try({
      try: () => jwt.decode(token),
      catch: P.toError,
    }),
    P.Effect.flatMap((decoded) =>
      !decoded || typeof decoded === 'string'
        ? P.Effect.fail(new Error('Invalid token payload'))
        : P.Effect.succeed(decoded)
    )
  );
}

// --------------------------------------------------------------------------
export function jwtSignToken(payload: jwt.JwtPayload, config: JwtSigningConfig): P.Effect.Effect<string, Error> {
  return P.Effect.try({
    try: () =>
      jwt.sign(payload, config.signingSecret, {
        issuer: config.issuer,
        expiresIn: config.maxTtlSec,
      }),
    catch: P.toError,
  });
}

// --------------------------------------------------------------------------
export function jwtVerifyToken(token: string, config: JwtVerificationConfig): P.Effect.Effect<JwtUserContext> {
  return P.pipe(
    P.Effect.try({
      try: () =>
        jwt.verify(token, config.signingSecret, {
          issuer: config.issuer,
          // [FIXME: make this configurable?]
          // maxAge: config.maxTtlSec,
        }),
      catch: P.toError,
    }),
    P.Effect.flatMap(checkJwtPayloadIssSub),
    P.Effect.map((jwtPayload: JwtPayloadSubIss) => JwtUserContext(true, jwtPayload)),
    P.Effect.orElse(() => P.Effect.succeed(JwtUserContext(false)))
  );
}
