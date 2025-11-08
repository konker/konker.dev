import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../../handler.js';
import type { StrBodyRec } from '../index.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

export const TAG = 'apiGatewayProxyEventV2Adapter';

// --------------------------------------------------------------------------
export type WithApiGatewayProxyEventRaw = {
  readonly apiGatewayProxyEventV2Raw: APIGatewayProxyEventV2;
};

// --------------------------------------------------------------------------
function sanitizeRecord(record?: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(record ?? {}).map(([k, v]) => [k, v ?? '']));
}

// --------------------------------------------------------------------------
export function adaptFromApiGatewayProxyEventV2(
  request: APIGatewayProxyEventV2
): RequestW<WithApiGatewayProxyEventRaw> {
  return {
    url: request.requestContext.http.path,
    method: request.requestContext.http.method,
    body: request.body ?? '',
    headers: sanitizeRecord(request.headers),
    queryStringParameters: sanitizeRecord(request.queryStringParameters),
    pathParameters: sanitizeRecord(request.pathParameters),
    apiGatewayProxyEventV2Raw: request,
  };
}

export function adaptToApiGatewayProxyResult<O extends StrBodyRec>(responseW: ResponseW<O>): APIGatewayProxyResult {
  return {
    statusCode: responseW.statusCode,
    body: responseW.body ?? '',
    headers: responseW.headers ?? {},
  };
}

// --------------------------------------------------------------------------
export const middleware =
  (_params?: never) =>
  <O extends StrBodyRec, E, R>(
    wrapped: Handler<RequestW<WithApiGatewayProxyEventRaw>, ResponseW<O>, E, R>
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
