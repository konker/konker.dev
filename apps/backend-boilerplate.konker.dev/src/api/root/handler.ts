import * as M from '@konker.dev/middleware-fp/http/contrib';
import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResult } from 'aws-lambda';
import { Effect, pipe } from 'effect';

import { core } from './core.js';

export type CoreEvent = M.apiGatewayProxyEventV2Adapter.WithApiGatewayProxyEventRaw;

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResult> => {
  const stack = pipe(
    core,
    M.helmetJsHeaders.middleware(),
    M.responseProcessor.middleware(),
    M.requestResponseLogger.middleware(),
    M.apiGatewayProxyEventV2Adapter.middleware()
  );
  return pipe(event, stack, Effect.runPromise);
};
