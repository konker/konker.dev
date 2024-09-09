import * as P from '@konker.dev/effect-ts-prelude';

import type * as jwt from 'jsonwebtoken';

export type JwtPayloadSubIss = jwt.JwtPayload & { sub: string; iss: string };

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
