import type { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerWithContextResult } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import type { LazyArg } from 'effect/Function';

import type { Handler } from '../index';
import type { BaseSimpleAuthResponseWithContext } from '../lib/http';

const TAG = 'awsSimpleAuthorizerWithContextProcessor';

export const middleware =
  <C>(defaultErrorContext: LazyArg<C>) =>
  <I extends APIGatewayRequestAuthorizerEventV2, O extends BaseSimpleAuthResponseWithContext<C>, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, APIGatewaySimpleAuthorizerWithContextResult<C>, never, R> =>
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
              context: defaultErrorContext(),
            }))
          ),
        onSuccess: (o: O) =>
          Effect.succeed({
            isAuthorized: o.isAuthorized,
            context: o.context,
          }),
      })
    );
  };
