import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { HttpApiError } from '../../HttpApiError.js';
import type { Rec, RequestResponseHandler } from '../../index.js';
import type { RequestW } from '../../RequestW.js';
import { validateHeaderValue } from './lib.js';

const TAG = 'headerValueAuthorizer';

// --------------------------------------------------------------------------
export type HeaderValueAuthorizerParams = {
  readonly headerName: string;
  readonly envVarName: string;
};

// --------------------------------------------------------------------------
export const middleware =
  (params: HeaderValueAuthorizerParams) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E | HttpApiError, R> =>
  (i: RequestW<I>) => {
    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(() =>
        Effect.if(validateHeaderValue(i.headers[params.headerName], process.env[params.envVarName]), {
          onTrue: () => Effect.succeed(i),
          onFalse: () =>
            Effect.fail(new HttpApiError({ statusCode: 401, message: `Invalid header: ${params.headerName}` })),
        })
      ),
      Effect.tapError((_) => Effect.logError(`UnauthorizedError: Invalid header: ${params.headerName}`)),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
