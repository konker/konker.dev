import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { FetchEffect } from '../index.js';
import type { WithUnknownRequestBody } from './common.js';

/**
 * Middleware to encode the request bodyObject into a string body property
 *
 * If no bodyObject is given, it is an error.
 */
export const EncodeJsonRequestBodyMiddleware =
  <I1 extends RequestInit, R1 extends Response>(fn: FetchEffect<I1, R1>): FetchEffect<WithUnknownRequestBody<I1>, R1> =>
  (url: URL | string, init: Partial<WithUnknownRequestBody<I1>> = {}) =>
    pipe(
      init.bodyObject,
      Schema.encode(Schema.parseJson()),
      Effect.map((bodyJson) => ({
        ...init,
        body: bodyJson,
      })),
      Effect.flatMap((stringBodyInit) => fn(url, stringBodyInit))
    );
