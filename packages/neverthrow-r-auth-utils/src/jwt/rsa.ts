import { fromResult, type ResultR } from '@konker.dev/neverthrow-r';
import * as jwt from 'jsonwebtoken';
import { ok, Result } from 'neverthrow';

import { toError } from '../lib/toError.js';
import type { JwtPayloadSubIss, JwtUserContext as JwtUserContextT } from './common.js';
import { checkJwtPayloadIssSub, JwtUserContext } from './common.js';

export type JwtSigningConfigRsa = {
  rsaPrivateKey: string;
  issuer: string;
  maxTtlSec: number;
};

export type JwtVerificationConfigRsa = {
  rsaPublicKey: string;
  issuer: string;
};

export function jwtSignTokenRsa(payload: jwt.JwtPayload, config: JwtSigningConfigRsa): ResultR<unknown, string, Error> {
  return fromResult(
    Result.fromThrowable(
      () =>
        jwt.sign(payload, config.rsaPrivateKey, {
          issuer: config.issuer,
          expiresIn: config.maxTtlSec,
          algorithm: 'RS256',
        }),
      toError
    )()
  );
}

export function jwtVerifyTokenRsa(
  token: string,
  config: JwtVerificationConfigRsa
): ResultR<unknown, JwtUserContextT, never> {
  return fromResult(
    Result.fromThrowable(
      () =>
        jwt.verify(token, config.rsaPublicKey, {
          issuer: config.issuer,
          algorithms: ['RS256'],
        }),
      toError
    )()
      .andThen((payload) => checkJwtPayloadIssSub(payload)({}))
      .map((jwtPayload: JwtPayloadSubIss) => JwtUserContext(true, jwtPayload))
      .orElse(() => ok(JwtUserContext(false)))
  );
}
