import { fromResult, type ResultR } from '@konker.dev/neverthrow-r';
import type * as jwt from 'jsonwebtoken';
import { err, ok } from 'neverthrow';

export type JwtPayloadSubIss = jwt.JwtPayload & {
  readonly sub: string;
  readonly iss: string;
};

export type JwtUserContext =
  | { readonly verified: false }
  | ({
      readonly verified: true;
      readonly userId: string;
    } & JwtPayloadSubIss);

export function JwtUserContext(verified: false): JwtUserContext;
export function JwtUserContext(verified: true, jwtPayload: JwtPayloadSubIss): JwtUserContext;
export function JwtUserContext(verified: boolean, jwtPayload?: JwtPayloadSubIss): JwtUserContext {
  return verified && jwtPayload
    ? { verified: true as const, userId: jwtPayload.sub, ...jwtPayload }
    : { verified: false as const };
}

export function checkJwtPayloadIssSub(
  payload: jwt.JwtPayload | string | null
): ResultR<unknown, JwtPayloadSubIss, Error> {
  if (!payload) {
    return fromResult(err(new Error('Invalid token payload: null')));
  }
  if (typeof payload === 'string') {
    return fromResult(err(new Error('Invalid token payload: string')));
  }

  const sub = payload.sub;
  const iss = payload.iss;
  if (!sub || !iss) {
    return fromResult(err(new Error('Invalid token payload: missing iss or sub')));
  }

  return fromResult(ok({ ...payload, sub, iss }));
}
