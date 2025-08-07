import { isTinyError, TinyError, toTinyError } from '@konker.dev/tiny-error-fp';
import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import { UNKNOWN_STRING_EFFECT } from './http.js';
import { makeResponseW, type ResponseW } from './http.js';

export const ERROR_TAG = 'HttpApiError' as const;
export type ERROR_TAG = typeof ERROR_TAG;

export type HttpApiError = TinyError<ERROR_TAG>;

export const HttpApiError = TinyError<ERROR_TAG>(ERROR_TAG, 500);
export const toHttpApiError = toTinyError<ERROR_TAG>(ERROR_TAG, HttpApiError);
export const isHttpApiError = isTinyError(ERROR_TAG);

export function toResponseW(error: HttpApiError): Effect.Effect<ResponseW, never, never> {
  return pipe(
    // Formulate response body
    { message: `${error.name}: ${error.message}`, statusCode: error.statusCode },
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
