import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../../index.js';
import type { RequestW } from '../../lib/http.js';
import { HttpApiError } from '../../lib/HttpApiError.js';
import { validateHeaderSignature } from './lib.js';

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
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E | HttpApiError, R | HeaderSignatureAuthorizerDeps> =>
  (i: RequestW<I>) => {
    return pipe(
      HeaderSignatureAuthorizerDeps,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(({ secret, signatureHeaderName }) =>
        Effect.if(validateHeaderSignature(i.headers[signatureHeaderName], i.body, secret), {
          onTrue: () => Effect.succeed(i),
          onFalse: () => Effect.fail(HttpApiError('UnauthorizedError', 'Invalid signature', 401)),
        })
      ),
      Effect.tapError((_) => Effect.logError(`UnauthorizedError: Invalid signature: ${i.body}`)),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
