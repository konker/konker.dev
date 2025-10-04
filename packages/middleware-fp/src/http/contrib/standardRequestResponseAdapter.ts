import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../../handler.js';
import type { Rec } from '../index.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

export const TAG = 'standardRequestResponseAdapter';

// --------------------------------------------------------------------------
export async function adaptFromStandardRequest(request: Request): Promise<RequestW> {
  return {
    url: request.url,
    method: request.method,
    body: await request.text(),
    headers: Object.fromEntries(request.headers),
    queryStringParameters: Object.fromEntries(new URL(request.url).searchParams),
    pathParameters: {},
  };
}

export function adaptToStandardResponse<O extends Rec>(responseW: ResponseW<O>): Response {
  return new Response(responseW.body, {
    status: responseW.statusCode,
    headers: responseW.headers,
  });
}

// --------------------------------------------------------------------------
export const middleware =
  (_params?: never) =>
  <O extends Rec, E, R>(wrapped: Handler<RequestW, ResponseW<O>, E, R>): Handler<Request, Response, E, R> =>
  (i: Request) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((request) => Effect.promise(() => adaptFromStandardRequest(request))),
      Effect.flatMap(wrapped),
      Effect.map(adaptToStandardResponse),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
