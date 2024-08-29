import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type { Handler } from '../../index';
import { HttpApiError } from '../../lib/HttpApiError';

const TAG = 'pathTokenAuthorizer';

// --------------------------------------------------------------------------
export type PathTokenAuthorizerDeps = {
  readonly secretTokenEnvName: string;
  readonly pathParamName: string;
};
export const PathTokenAuthorizerDeps = P.Context.GenericTag<PathTokenAuthorizerDeps>('PathTokenAuthorizerDeps');

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, O, E | HttpApiError, R | PathTokenAuthorizerDeps> =>
  (i: I) => {
    return P.pipe(
      PathTokenAuthorizerDeps,
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap(({ pathParamName, secretTokenEnvName }) =>
        P.Effect.if(
          !!process.env[secretTokenEnvName] && i.pathParameters?.[pathParamName] === process.env[secretTokenEnvName],
          {
            onTrue: () => P.Effect.succeed(i),
            onFalse: () =>
              P.pipe(
                P.Effect.fail(HttpApiError('UnauthorizedError', 'Invalid token', 401)),
                P.Effect.tap(P.Effect.logError('UnauthorizedError: Invalid token'))
              ),
          }
        )
      ),
      P.Effect.flatMap(wrapped),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
