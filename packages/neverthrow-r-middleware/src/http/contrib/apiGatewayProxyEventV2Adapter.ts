import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';
import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';

import type { Handler } from '../../handler.js';
import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import { sanitizeRecord } from '../../lib/utils.js';
import type { StrBodyRec } from '../RequestResponseHandler.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

export const TAG = 'apiGatewayProxyEventV2Adapter';

export type WithApiGatewayProxyEventRaw = {
  readonly apiGatewayProxyEventV2Raw: APIGatewayProxyEventV2;
};

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
    headers: responseW.headers,
  };
}

export const middleware =
  (_params?: never) =>
  <O extends StrBodyRec, E, R>(
    wrapped: Handler<RequestW<WithApiGatewayProxyEventRaw>, ResponseW<O>, E, R>
  ): Handler<APIGatewayProxyEventV2, APIGatewayProxyResult, E, R & WithLogger> =>
  (i: APIGatewayProxyEventV2) =>
    pipe(
      okAsyncR<APIGatewayProxyEventV2>(i),
      tapLogger('debug', `[${TAG}] IN`),
      mapAsync(adaptFromApiGatewayProxyEventV2),
      andThenAsync(wrapped),
      mapAsync(adaptToApiGatewayProxyResult),
      tapLogger('debug', `[${TAG}] OUT`)
    );
