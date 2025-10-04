import { Buffer } from 'node:buffer';

import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../../handler.js';
import { type MiddlewareError, toMiddlewareError } from '../../lib/MiddlewareError.js';
import type { Rec } from '../index.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

export const TAG = 'fetchAdapter';

// --------------------------------------------------------------------------
export type WithFetchRequestRaw = {
  readonly fetchRequestRaw: Request;
};

// --------------------------------------------------------------------------
export function sanitizeRecord(record?: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(record ?? {}).map(([k, v]) => [k, v ?? '']));
}

// --------------------------------------------------------------------------
export function adaptFromFetchRequest(request: Request): Effect.Effect<RequestW<WithFetchRequestRaw>, MiddlewareError> {
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

export function adaptToFetchResponse<O extends Rec>(responseW: ResponseW<O>): Effect.Effect<Response, MiddlewareError> {
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
  <O extends Rec, E, R>(
    wrapped: Handler<RequestW<WithFetchRequestRaw>, ResponseW<O>, E, R>
  ): Handler<Request, Response, E | MiddlewareError, R> =>
  (i: Request) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(adaptFromFetchRequest),
      Effect.flatMap(wrapped),
      Effect.flatMap(adaptToFetchResponse),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
