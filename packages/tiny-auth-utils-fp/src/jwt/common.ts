import * as Effect from 'effect/Effect';
import type * as jwt from 'jsonwebtoken';

// --------------------------------------------------------------------------
export type JwtPayloadSubIss = jwt.JwtPayload & {
  readonly sub: string;
  readonly iss: string;
};

export type JwtUserContext =
  | { readonly verified: false; readonly reason?: string }
  | ({
      readonly verified: true;
      readonly userId: string;
    } & JwtPayloadSubIss);

export function JwtUserContext(verified: false, reason?: string): JwtUserContext;
export function JwtUserContext(verified: true, jwtPayload: JwtPayloadSubIss): JwtUserContext;
export function JwtUserContext(verified: boolean, jwtPayloadOrReason?: JwtPayloadSubIss | string): JwtUserContext {
  if (verified && jwtPayloadOrReason && typeof jwtPayloadOrReason !== 'string') {
    return { verified: true as const, userId: jwtPayloadOrReason.sub, ...jwtPayloadOrReason };
  }
  return typeof jwtPayloadOrReason === 'string'
    ? { verified: false as const, reason: jwtPayloadOrReason }
    : { verified: false as const };
}

// --------------------------------------------------------------------------
export function checkJwtPayloadIssSub(payload: jwt.JwtPayload | string | null): Effect.Effect<JwtPayloadSubIss, Error> {
  if (!payload) {
    return Effect.fail(new Error('Invalid token payload: null'));
  }
  if (typeof payload === 'string') {
    return Effect.fail(new Error('Invalid token payload: string'));
  }
  const sub = payload.sub;
  const iss = payload.iss;
  if (!sub || !iss) {
    return Effect.fail(new Error('Invalid token payload: missing iss or sub'));
  }

  return Effect.succeed({ ...payload, sub, iss });
}
