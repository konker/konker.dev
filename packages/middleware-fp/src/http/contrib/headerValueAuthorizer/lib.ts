import * as Effect from 'effect/Effect';

import { type HttpApiError, toHttpApiError } from '../../HttpApiError.js';

export function validateHeaderValue(
  headerValue: string | undefined,
  correctValue: string | undefined
): Effect.Effect<boolean, HttpApiError> {
  if (!correctValue) {
    return Effect.fail(toHttpApiError(new Error(), 500, 'Internal server error'));
  }
  return Effect.succeed(headerValue === correctValue);
}
