import { sha256HmacHex } from '@konker.dev/tiny-utils-fp/hash';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { type HttpApiError, toHttpApiError } from '../../lib/HttpApiError.js';

export function validateHeaderSignature(
  signature: string | undefined,
  requestRawBody: unknown,
  secret: string
): Effect.Effect<boolean, HttpApiError> {
  if (!signature) {
    return Effect.succeed(false);
  }
  return pipe(
    sha256HmacHex(String(requestRawBody), secret),
    Effect.flatMap((calculatedHmac) => Effect.succeed(calculatedHmac === signature)),
    Effect.mapError(toHttpApiError)
  );
}
