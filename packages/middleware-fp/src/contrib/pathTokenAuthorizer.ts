import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../index.js';
import type { RequestW } from '../lib/http.js';
import { HttpApiError } from '../lib/HttpApiError.js';

const TAG = 'pathTokenAuthorizer';

// --------------------------------------------------------------------------
export type PathTokenAuthorizerDeps = {
  readonly secretTokenEnvName: string;
  readonly pathParamName: string;
};
export const PathTokenAuthorizerDeps = Context.GenericTag<PathTokenAuthorizerDeps>('PathTokenAuthorizerDeps');

// --------------------------------------------------------------------------
export const middleware =
  () =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E | HttpApiError, R | PathTokenAuthorizerDeps> =>
  (i: RequestW<I>) => {
    return pipe(
      PathTokenAuthorizerDeps,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(({ pathParamName, secretTokenEnvName }) =>
        Effect.if(
          !!process.env[secretTokenEnvName] && i.pathParameters?.[pathParamName] === process.env[secretTokenEnvName],
          {
            onTrue: () => Effect.succeed(i),
            onFalse: () =>
              pipe(
                Effect.fail(HttpApiError('UnauthorizedError', 'Invalid token', 401)),
                Effect.tap(Effect.logError('UnauthorizedError: Invalid token'))
              ),
          }
        )
      ),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
