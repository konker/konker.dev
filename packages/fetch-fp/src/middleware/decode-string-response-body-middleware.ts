import { toError } from '@konker.dev/tiny-error-fp/lib';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { FetchEffect } from '../index.js';
import type { WithBodyString } from './common.js';

/**
 * Function to convert a response body into a string`
 */
export function decodeStringResponseBody<R extends Response>(response: R): Effect.Effect<WithBodyString<R>, Error> {
  return Effect.tryPromise({
    try: async () => ({
      ...response,
      bodyString: await response.text(),
    }),
    catch: toError,
  });
}

/**
 * Middleware to convert the response body into a string property
 */
export const DecodeStringResponseBodyMiddleware =
  <I1 extends RequestInit, R1 extends Response>(fn: FetchEffect<I1, R1>): FetchEffect<I1, WithBodyString<R1>> =>
  (url: URL | string, init: Partial<I1> = {}) =>
    pipe(fn(url, init), Effect.flatMap(decodeStringResponseBody));
