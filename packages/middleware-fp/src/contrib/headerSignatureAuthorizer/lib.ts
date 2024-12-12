import { sha256HmacHex } from '@konker.dev/tiny-utils-fp/hash';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { HttpApiError } from '../../lib/HttpApiError';
import { toHttpApiError } from '../../lib/HttpApiError';

export function validateHeaderSignature(
  signature: string,
  requestRawBody: unknown,
  secret: string
): Effect.Effect<boolean, HttpApiError> {
  return pipe(
    sha256HmacHex(String(requestRawBody), secret),
    Effect.flatMap((calculatedHmac) => Effect.succeed(calculatedHmac === signature)),
    Effect.mapError(toHttpApiError)
  );
}
