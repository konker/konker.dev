import * as P from '@konker.dev/effect-ts-prelude';

import { generateLambdaAuthResultDeny } from '@konker.dev/tiny-auth-utils-fp/dist/aws-authorizer';
import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';

import type { Handler } from '../../index';

const TAG = 'authorizer-processor';

export const ANON_PRINCIPAL_ID = 'anon';
export const DEFAULT_ROUTE_ARN = '*';

export const middleware =
  <I extends APIGatewayRequestAuthorizerEventV2, WO extends APIGatewayAuthorizerResult, WE, WR>(
    wrapped: Handler<I, WO, WE, WR>
  ): Handler<I, APIGatewayAuthorizerResult, WE, WR> =>
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
            P.Effect.map((_) => generateLambdaAuthResultDeny(ANON_PRINCIPAL_ID, DEFAULT_ROUTE_ARN))
          ),
        onSuccess: (o: WO) => P.Effect.succeed(o),
      })
    );
  };
