import { fromResult, type ResultR } from '@konker.dev/neverthrow-r';
import * as jwt from 'jsonwebtoken';
import { err, ok, Result } from 'neverthrow';

import { toError } from '../lib/toError.js';
import type { JwtPayloadSubIss, JwtUserContext as JwtUserContextT } from './common.js';
import { checkJwtPayloadIssSub, JwtUserContext } from './common.js';

export type JwtSigningConfig = {
  signingSecret: string;
  issuer: string;
  maxTtlSec: number;
};

export type JwtVerificationConfig = {
  signingSecret: string;
  issuer: string;
};

export function jwtDecodeToken(token: string): ResultR<unknown, jwt.JwtPayload, Error> {
  return fromResult(
    Result.fromThrowable(() => jwt.decode(token), toError)().andThen((decoded) =>
      !decoded || typeof decoded === 'string' ? err(new Error('Invalid token payload')) : ok(decoded)
    )
  );
}

export function jwtSignToken(payload: jwt.JwtPayload, config: JwtSigningConfig): ResultR<unknown, string, Error> {
  return fromResult(
    Result.fromThrowable(
      () =>
        jwt.sign(payload, config.signingSecret, {
          issuer: config.issuer,
          expiresIn: config.maxTtlSec,
        }),
      toError
    )()
  );
}

export function jwtVerifyToken(token: string, config: JwtVerificationConfig): ResultR<unknown, JwtUserContextT, never> {
  return fromResult(
    Result.fromThrowable(
      () =>
        jwt.verify(token, config.signingSecret, {
          issuer: config.issuer,
        }),
      toError
    )()
      .andThen((payload) => checkJwtPayloadIssSub(payload)({}))
      .map((jwtPayload: JwtPayloadSubIss) => JwtUserContext(true, jwtPayload))
      .orElse(() => ok(JwtUserContext(false)))
  );
}
