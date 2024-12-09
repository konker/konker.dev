import type { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerResult } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';
import type { BaseSimpleAuthResponse } from '../lib/http';

const TAG = 'awsSimpleAuthorizerProcessor';

export const middleware =
  () =>
  <I extends APIGatewayRequestAuthorizerEventV2, O extends BaseSimpleAuthResponse, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, APIGatewaySimpleAuthorizerResult, never, R> =>
  (i: I) => {
    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`)),
      Effect.matchEffect({
        onFailure: (e) =>
          pipe(
            Effect.succeed(e),
            Effect.tap(Effect.logError('Internal server error', e)),
            Effect.map((_) => ({
              isAuthorized: false,
            }))
          ),
        onSuccess: (o: O) =>
          Effect.succeed({
            isAuthorized: o.isAuthorized,
          }),
      })
    );
  };
