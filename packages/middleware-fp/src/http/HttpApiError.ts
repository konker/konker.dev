/* eslint-disable fp/no-class */
import { pipe, Predicate, Schema } from 'effect';
import { TaggedError } from 'effect/Data';
import * as Effect from 'effect/Effect';

import { UNKNOWN_STRING_EFFECT } from './RequestResponseHandler.js';
import { makeResponseW, type ResponseW } from './ResponseW.js';

export const ERROR_TAG = 'HttpApiError' as const;

// --------------------------------------------------------------------------
export class HttpApiError extends TaggedError(ERROR_TAG)<{
  readonly statusCode: number;
  readonly message: string;
  readonly internal?: Array<unknown>;
}> {}

// --------------------------------------------------------------------------
export function isHttpApiError(x: unknown): x is HttpApiError {
  return Predicate.isTagged(ERROR_TAG)(x);
}

// --------------------------------------------------------------------------
export function toHttpApiError(x: unknown, statusCode?: number, message?: string): HttpApiError {
  if (isHttpApiError(x)) {
    return new HttpApiError({
      statusCode: statusCode ?? x.statusCode,
      message: message ?? x.message,
      internal: [x, ...(x.internal ?? [])],
    });
  }

  return new HttpApiError({
    statusCode: statusCode ?? 500,
    message: message ?? 'Internal Server Error',
    internal: [x],
  });
}

// --------------------------------------------------------------------------
export function toErrorResponseW(error: HttpApiError): Effect.Effect<ResponseW, never, never> {
  return pipe(
    // Formulate response
    { message: error.message, statusCode: error.statusCode },
    Schema.encode(Schema.parseJson()),
    Effect.orElse<string, never, never>(UNKNOWN_STRING_EFFECT),
    Effect.map((body) =>
      makeResponseW({
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })
    )
  );
}
