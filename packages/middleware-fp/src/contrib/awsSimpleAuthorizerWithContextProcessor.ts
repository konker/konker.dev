import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayRequestAuthorizerEventV2, APIGatewaySimpleAuthorizerWithContextResult } from 'aws-lambda';

import type { Handler } from '../index';
import type { BaseSimpleAuthResponseWithContext } from '../lib/http';

const TAG = 'awsSimpleAuthorizerWithContextProcessor';

export const middleware =
  <C>(defaultErrorContext: P.LazyArg<C>) =>
  <I extends APIGatewayRequestAuthorizerEventV2, O extends BaseSimpleAuthResponseWithContext<C>, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, APIGatewaySimpleAuthorizerWithContextResult<C>, never, R> =>
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
              context: defaultErrorContext(),
            }))
          ),
        onSuccess: (o: O) =>
          P.Effect.succeed({
            isAuthorized: o.isAuthorized,
            context: o.context,
          }),
      })
    );
  };
