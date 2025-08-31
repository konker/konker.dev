import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../../index.js';
import type { Rec } from '../index.js';
import type { RequestW } from '../request.js';
import type { ResponseW } from '../response.js';

export const TAG = 'apiGatewayProxyEventV2Adapter';

// --------------------------------------------------------------------------
function sanitizeRecord(record?: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(record ?? {}).map(([k, v]) => [k, v ?? '']));
}

// --------------------------------------------------------------------------
export function adaptFromApiGatewayProxyEventV2(request: APIGatewayProxyEventV2): RequestW {
  return {
    url: request.requestContext.http.path,
    method: request.requestContext.http.method,
    body: request.body ?? '',
    headers: sanitizeRecord(request.headers),
    queryStringParameters: sanitizeRecord(request.queryStringParameters),
    pathParameters: sanitizeRecord(request.pathParameters),
  };
}

export function adaptToApiGatewayProxyResult<O extends Rec>(responseW: ResponseW<O>): APIGatewayProxyResult {
  return {
    statusCode: responseW.statusCode,
    body: responseW.body ?? '',
    headers: responseW.headers ?? {},
  };
}

// --------------------------------------------------------------------------
export const middleware =
  (_params?: never) =>
  <O extends Rec, E, R>(
    wrapped: Handler<RequestW, ResponseW<O>, E, R>
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyResult, E, R> =>
  (i: APIGatewayProxyEventV2) =>
    pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.map(adaptFromApiGatewayProxyEventV2),
      Effect.flatMap(wrapped),
      Effect.map(adaptToApiGatewayProxyResult),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
