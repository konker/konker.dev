import { Buffer } from 'node:buffer';

import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import type { HonoRequest } from 'hono';

import type { Handler } from '../../index.js';
import { type MiddlewareError, toMiddlewareError } from '../../lib/MiddlewareError.js';
import type { Rec } from '../index.js';
import type { RequestW } from '../request.js';
import type { ResponseW } from '../response.js';

export const TAG = 'honoAdapter';

// --------------------------------------------------------------------------
export type WithHonoRequestRaw = {
  readonly honoRequestRaw: HonoRequest;
};

// --------------------------------------------------------------------------
export function sanitizeRecord(record?: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(record ?? {}).map(([k, v]) => [k, v ?? '']));
}

// --------------------------------------------------------------------------
export function adaptFromHonoRequest(
  request: HonoRequest
): Effect.Effect<RequestW<WithHonoRequestRaw>, MiddlewareError> {
  return Effect.tryPromise({
    try: async () => ({
      url: request.url,
      method: request.method,
      body: await request.text(),
      headers: sanitizeRecord(request.header()),
      queryStringParameters: sanitizeRecord(request.query()),
      pathParameters: sanitizeRecord(request.param()),
      honoRequestRaw: request,
    }),
    catch: toMiddlewareError,
  });
}

export function adaptToHonoResponse<O extends Rec>(responseW: ResponseW<O>): Effect.Effect<Response, MiddlewareError> {
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
    wrapped: Handler<RequestW<WithHonoRequestRaw>, ResponseW<O>, E, R>
  ): Handler<HonoRequest, Response, E | MiddlewareError, R> =>
  (i: HonoRequest) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(adaptFromHonoRequest),
      Effect.flatMap(wrapped),
      Effect.flatMap(adaptToHonoResponse),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
