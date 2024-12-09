import { toError } from '@konker.dev/tiny-error-fp/dist/lib';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import * as jwt from 'jsonwebtoken';

import type { JwtPayloadSubIss } from './common.js';
import { checkJwtPayloadIssSub, JwtUserContext } from './common.js';

// --------------------------------------------------------------------------
export type JwtSigningConfigRsa = {
  rsaPrivateKey: string;
  issuer: string;
  maxTtlSec: number;
};

export type JwtVerificationConfigRsa = {
  rsaPublicKey: string;
  issuer: string;
};

// --------------------------------------------------------------------------
export function jwtSignTokenRsa(payload: jwt.JwtPayload, config: JwtSigningConfigRsa): Effect.Effect<string, Error> {
  return Effect.try({
    try: () =>
      jwt.sign(payload, config.rsaPrivateKey, {
        issuer: config.issuer,
        expiresIn: config.maxTtlSec,
        algorithm: 'RS256',
      }),
    catch: toError,
  });
}

// --------------------------------------------------------------------------
export function jwtVerifyTokenRsa(token: string, config: JwtVerificationConfigRsa): Effect.Effect<JwtUserContext> {
  return pipe(
    Effect.try({
      try: () =>
        jwt.verify(token, config.rsaPublicKey, {
          issuer: config.issuer,
          algorithms: ['RS256'],
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
