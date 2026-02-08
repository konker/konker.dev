import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { HttpApiError } from '../HttpApiError.js';
import type { Rec, RequestResponseHandler } from '../index.js';
import type { RequestW } from '../RequestW.js';

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
            onFalse: () => pipe(Effect.fail(new HttpApiError({ statusCode: 401, message: 'Invalid token' }))),
          }
        )
      ),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`)),
      Effect.withSpan(TAG)
    );
  };
