import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type { Handler } from '../../index';
import { HttpApiError } from '../../lib/HttpApiError';
import { validateHeaderSignature } from './lib';

const TAG = 'headerSignatureAuthorizer';

// --------------------------------------------------------------------------
export type HeaderSignatureAuthorizerDeps = {
  readonly secret: string;
  readonly signatureHeaderName: string;
};
export const HeaderSignatureAuthorizerDeps = P.Context.GenericTag<HeaderSignatureAuthorizerDeps>(
  'HeaderSignatureAuthorizerDeps'
);

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, O, E | HttpApiError, R | HeaderSignatureAuthorizerDeps> =>
  (i: I) => {
    return P.pipe(
      HeaderSignatureAuthorizerDeps,
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap(({ secret, signatureHeaderName }) =>
        P.Effect.if(validateHeaderSignature(i.headers[signatureHeaderName]!, i.body, secret), {
          onTrue: () => P.Effect.succeed(i),
          onFalse: () => P.Effect.fail(HttpApiError('UnauthorizedError', 'Invalid signature', 401)),
        })
      ),
      P.Effect.tapError((_) => P.Effect.logError(`UnauthorizedError: Invalid signature: ${i.body}`)),
      P.Effect.flatMap(wrapped),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
  };
