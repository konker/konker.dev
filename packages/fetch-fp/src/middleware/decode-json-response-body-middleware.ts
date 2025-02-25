import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { FetchEffect } from '../index.js';
import type { WithBodyString, WithParsedBody } from './common.js';

/**
 * Middleware to safely JSON parse a Response which contains a decoded string body
 */
export const DecodeJsonResponseBodyMiddleware =
  <I1 extends RequestInit, R1 extends WithBodyString<Response>>(
    fn: FetchEffect<I1, R1>
  ): FetchEffect<I1, WithParsedBody<R1>> =>
  (url: URL | string, init: Partial<I1> = {}) =>
    pipe(
      Effect.Do,
      Effect.bind('response', () => fn(url, init)),
      Effect.bind('parsedBody', ({ response }) => pipe(response.bodyString, Schema.decode(Schema.parseJson()))),
      Effect.map(({ parsedBody, response }) => ({
        ...response,
        parsedBody,
      }))
    );
