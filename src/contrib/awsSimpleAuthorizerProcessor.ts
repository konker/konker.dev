import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerResult } from 'aws-lambda';

import type { Handler } from '../index';
import type { BaseSimpleAuthResponse } from '../lib/http';

const TAG = 'awsSimpleAuthorizerProcessor';

export const middleware =
  <I extends APIGatewayRequestAuthorizerEventV2, O extends BaseSimpleAuthResponse, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, APIGatewaySimpleAuthorizerResult, E, R> =>
  (i: I) => {
    return P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap(wrapped),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`)),
      P.Effect.matchEffect({
        onFailure: (e) =>
          P.pipe(
            P.Effect.succeed(e),
            P.Effect.tap(P.Effect.logError('Internal server error', e)),
            P.Effect.map((_) => ({
              isAuthorized: false,
            }))
          ),
        onSuccess: (o: O) =>
          P.Effect.succeed({
            isAuthorized: o.isAuthorized,
          }),
      })
    );
  };
