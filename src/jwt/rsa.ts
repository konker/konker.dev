import * as P from '@konker.dev/effect-ts-prelude';

import * as jwt from 'jsonwebtoken';

import type { JwtPayloadSubIss } from './common';
import { checkJwtPayloadIssSub } from './common';

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
export function jwtSignTokenRsa(payload: jwt.JwtPayload, config: JwtSigningConfigRsa): P.Effect.Effect<string, Error> {
  return P.Effect.try({
    try: () =>
      jwt.sign(payload, config.rsaPrivateKey, {
        issuer: config.issuer,
        expiresIn: config.maxTtlSec,
        algorithm: 'RS256',
      }),
    catch: P.toError,
  });
}

// --------------------------------------------------------------------------
export function jwtVerifyTokenRsa(
  token: string,
  config: JwtVerificationConfigRsa
): P.Effect.Effect<JwtPayloadSubIss, Error> {
  return P.pipe(
    P.Effect.try({
      try: () =>
        jwt.verify(token, config.rsaPublicKey, {
          issuer: config.issuer,
          algorithms: ['RS256'],
          // [FIXME: make this configurable?]
          // maxAge: config.maxTtlSec,
        }),
      catch: P.toError,
    }),
    P.Effect.flatMap(checkJwtPayloadIssSub)
  );
}
