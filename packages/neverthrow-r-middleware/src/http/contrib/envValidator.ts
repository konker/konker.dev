import { andThenAsync, mapAsync, mapErrAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';
import { andThenParseAsyncR } from '@konker.dev/neverthrow-r-schema/async';
import type { SchemaValidationError } from '@konker.dev/neverthrow-r-schema/common';
import type { StandardSchemaV1 } from '@standard-schema/spec';

import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { middlewareError } from '../../lib/MiddlewareError.js';
import type { Override, Rec, RequestResponseHandler } from '../RequestResponseHandler.js';
import { makeRequestW, type RequestW } from '../RequestW.js';
import { makeResponseW } from '../ResponseW.js';

export const TAG = 'envValidator';

export type WithValidatedEnv<V> = {
  readonly validatedEnv: V;
};

const toMiddlewareError = (error: SchemaValidationError): MiddlewareError =>
  middlewareError(error.message, error.cause === undefined ? error.issues : [error.cause, ...error.issues]);

export const middleware =
  <V>(schema: StandardSchemaV1<unknown, V>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<Override<I, WithValidatedEnv<V>>, R, O, E>
  ): RequestResponseHandler<I, R & WithLogger, O, E | MiddlewareError> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR(process.env),
      tapLogger('debug', `[${TAG}] IN`),
      andThenParseAsyncR(schema, { message: 'Environment validation failed' }),
      mapErrAsync(toMiddlewareError),
      mapAsync((validatedEnv) => makeRequestW(i, { validatedEnv })),
      andThenAsync(wrapped),
      mapAsync((res) => makeResponseW(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
