import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../../index';
import { HttpApiError } from '../../lib/HttpApiError';
import { validateHeaderSignature } from './lib';

const TAG = 'headerSignatureAuthorizer';

// --------------------------------------------------------------------------
export type HeaderSignatureAuthorizerDeps = {
  readonly secret: string;
  readonly signatureHeaderName: string;
};
export const HeaderSignatureAuthorizerDeps = Context.GenericTag<HeaderSignatureAuthorizerDeps>(
  'HeaderSignatureAuthorizerDeps'
);

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, O, E | HttpApiError, R | HeaderSignatureAuthorizerDeps> =>
  (i: I) => {
    return pipe(
      HeaderSignatureAuthorizerDeps,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(({ secret, signatureHeaderName }) =>
        Effect.if(validateHeaderSignature(i.headers[signatureHeaderName]!, i.body, secret), {
          onTrue: () => Effect.succeed(i),
          onFalse: () => Effect.fail(HttpApiError('UnauthorizedError', 'Invalid signature', 401)),
        })
      ),
      Effect.tapError((_) => Effect.logError(`UnauthorizedError: Invalid signature: ${i.body}`)),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
