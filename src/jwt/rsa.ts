import * as P from '@konker.dev/effect-ts-prelude';

import * as jwt from 'jsonwebtoken';

import type { JwtPayloadSubIss } from './index';

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
export function signTokenRsa(payload: jwt.JwtPayload, config: JwtSigningConfigRsa): P.Either.Either<string, Error> {
  return P.Either.try({
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
export function verifyTokenRsa(
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
    P.Effect.flatMap((payload: jwt.JwtPayload | string) => {
      // code coverage ignored here, because if the payload is a string,
      // then issuer verification has already failed
      /* istanbul ignore next */
      if (typeof payload === 'string') {
        return P.Effect.fail(new Error('Invalid token payload: string'));
      }
      const sub = payload.sub;
      const iss = payload.iss;
      if (!sub || !iss) {
        return P.Effect.fail(new Error('Invalid token payload: missing iss or sub'));
      }

      return P.Effect.succeed({ ...payload, sub, iss });
    })
  );
}
