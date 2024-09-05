import * as P from '@konker.dev/effect-ts-prelude';

import { generateLambdaAuthResultDeny } from '@konker.dev/tiny-auth-utils-fp/dist/aws-authorizer';
import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';

import type { Handler } from '../index';

const TAG = 'awsIamAuthorizerProcessor';

export const ANON_PRINCIPAL_ID = 'anon';
export const DEFAULT_ROUTE_ARN = '*';

export const middleware =
  <I extends APIGatewayRequestAuthorizerEventV2, O extends APIGatewayAuthorizerResult, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, APIGatewayAuthorizerResult, E, R> =>
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
        onSuccess: (o: O) => P.Effect.succeed(o),
      })
    );
  };
