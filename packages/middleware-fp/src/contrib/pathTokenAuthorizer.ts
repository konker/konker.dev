import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index.js';
import { HttpApiError } from '../lib/HttpApiError.js';

const TAG = 'pathTokenAuthorizer';

// --------------------------------------------------------------------------
export type PathTokenAuthorizerDeps = {
  readonly secretTokenEnvName: string;
  readonly pathParamName: string;
};
export const PathTokenAuthorizerDeps = Context.GenericTag<PathTokenAuthorizerDeps>('PathTokenAuthorizerDeps');

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, O, E | HttpApiError, R | PathTokenAuthorizerDeps> =>
  (i: I) => {
    return pipe(
      PathTokenAuthorizerDeps,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(({ pathParamName, secretTokenEnvName }) =>
        Effect.if(
          !!process.env[secretTokenEnvName] && i.pathParameters?.[pathParamName] === process.env[secretTokenEnvName],
          {
            onTrue: () => Effect.succeed(i),
            onFalse: () =>
              pipe(
                Effect.fail(HttpApiError('UnauthorizedError', 'Invalid token', 401)),
                Effect.tap(Effect.logError('UnauthorizedError: Invalid token'))
              ),
          }
        )
      ),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
