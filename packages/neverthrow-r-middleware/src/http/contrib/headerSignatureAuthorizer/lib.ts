import { fromResult, type ResultR } from '@konker.dev/neverthrow-r';
import { sha256HmacHex } from '@konker.dev/neverthrow-r-utils/hash';
import { ok } from 'neverthrow';

import { type HttpApiError, toHttpApiError } from '../../HttpApiError.js';

export function validateHeaderSignature(
  signature: string | undefined,
  requestRawBody: unknown,
  secret: string
): ResultR<unknown, boolean, HttpApiError> {
  if (!signature) {
    return fromResult(ok(false));
  }

  return fromResult(
    sha256HmacHex(
      String(requestRawBody),
      secret
    )(undefined)
      .map((calculatedHmac) => calculatedHmac === signature)
      .mapErr(toHttpApiError)
  );
}
