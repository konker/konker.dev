import * as P from '@konker.dev/effect-ts-prelude';

import type * as jwt from 'jsonwebtoken';

// --------------------------------------------------------------------------
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

// --------------------------------------------------------------------------
export function checkJwtPayloadIssSub(
  payload: jwt.JwtPayload | string | null
): P.Effect.Effect<JwtPayloadSubIss, Error> {
  if (!payload) {
    return P.Effect.fail(new Error('Invalid token payload: null'));
  }
  if (typeof payload === 'string') {
    return P.Effect.fail(new Error('Invalid token payload: string'));
  }
  const sub = payload.sub;
  const iss = payload.iss;
  if (!sub || !iss) {
    return P.Effect.fail(new Error('Invalid token payload: missing iss or sub'));
  }

  return P.Effect.succeed({ ...payload, sub, iss });
}
