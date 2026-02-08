import { Buffer } from 'node:buffer';

import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../../handler.js';
import { type MiddlewareError, toMiddlewareError } from '../../lib/MiddlewareError.js';
import { sanitizeRecord } from '../../lib/utils.js';
import type { StrBodyRec } from '../index.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

export const TAG = 'standardRequestResponseAdapter';

// --------------------------------------------------------------------------
export type WithStandardRequestRaw = {
  readonly fetchRequestRaw: Request;
};

// --------------------------------------------------------------------------
export function adaptFromStandardRequest(
  request: Request
): Effect.Effect<RequestW<WithStandardRequestRaw>, MiddlewareError> {
  return Effect.tryPromise({
    try: async () => ({
      url: request.url,
      method: request.method,
      body: await request.text(),
      headers: sanitizeRecord(Object.fromEntries(request.headers?.entries() ?? [])),
      queryStringParameters: sanitizeRecord(Object.fromEntries(new URL(request.url).searchParams.entries())),
      pathParameters: {},
      fetchRequestRaw: request,
    }),
    catch: toMiddlewareError,
  });
}

// Note, we intentionally use an Effect here, even though
// the current implementation is pure, to allow for more
// complicated processing in the future.
export function adaptToStandardResponse<O extends StrBodyRec>(
  responseW: ResponseW<O>
): Effect.Effect<Response, MiddlewareError> {
  return Effect.tryPromise({
    try: async () =>
      new Response(Buffer.from(responseW.body ?? ''), {
        status: responseW.statusCode,
        headers: new Headers(responseW.headers ?? {}),
      }),
    catch: toMiddlewareError,
  });
}

// --------------------------------------------------------------------------
export const middleware =
  (_params?: never) =>
  <O extends StrBodyRec, E, R>(
    wrapped: Handler<RequestW<WithStandardRequestRaw>, ResponseW<O>, E, R>
  ): Handler<Request, Response, E | MiddlewareError, R> =>
  (i: Request) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(adaptFromStandardRequest),
      Effect.flatMap(wrapped),
      Effect.flatMap(adaptToStandardResponse),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`)),
      Effect.withSpan(TAG)
    );
