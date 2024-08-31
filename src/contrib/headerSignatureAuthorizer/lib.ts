import * as P from '@konker.dev/effect-ts-prelude';

import { sha256HmacHex } from '@konker.dev/tiny-utils-fp';

import type { HttpApiError } from '../../lib/HttpApiError';
import { toHttpApiError } from '../../lib/HttpApiError';

export function validateHeaderSignature(
  signature: string,
  requestRawBody: unknown,
  secret: string
): P.Effect.Effect<boolean, HttpApiError> {
  return P.pipe(
    sha256HmacHex(String(requestRawBody), secret),
    P.Effect.flatMap((calculatedHmac) => P.Effect.succeed(calculatedHmac === signature)),
    P.Effect.mapError(toHttpApiError)
  );
}
