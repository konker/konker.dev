import * as P from '@konker.dev/effect-ts-prelude';

import * as jwt from 'jsonwebtoken';

// --------------------------------------------------------------------------
export type JwtConfig = {
  signingSecret: string;
  issuer: string;
  maxTtlSec: number;
};

export type JwtPayloadSubIss = jwt.JwtPayload & { sub: string; iss: string };

// --------------------------------------------------------------------------
export function signToken(payload: jwt.JwtPayload, config: JwtConfig): P.Either.Either<string, Error> {
  return P.Either.try({
    try: () =>
      jwt.sign(payload, config.signingSecret, {
        issuer: config.issuer,
        expiresIn: config.maxTtlSec,
      }),
    catch: P.toError,
  });
}

// --------------------------------------------------------------------------
export function verifyToken(token: string, config: JwtConfig): P.Effect.Effect<JwtPayloadSubIss, Error> {
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
