import { generateLambdaAuthResultDeny } from '@konker.dev/tiny-auth-utils-fp/aws-authorizer';
import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';

const TAG = 'awsIamAuthorizerProcessor';

export const ANON_PRINCIPAL_ID = 'anon';
export const DEFAULT_ROUTE_ARN = '*';

export const middleware =
  () =>
  <I extends APIGatewayRequestAuthorizerEventV2, O extends APIGatewayAuthorizerResult, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, APIGatewayAuthorizerResult, never, R> =>
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
            Effect.map((_) => generateLambdaAuthResultDeny(ANON_PRINCIPAL_ID, DEFAULT_ROUTE_ARN))
          ),
        onSuccess: (o: O) => Effect.succeed(o),
      })
    );
  };
