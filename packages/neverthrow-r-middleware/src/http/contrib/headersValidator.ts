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

export const TAG = 'headersValidator';

export type WithValidatedHeaders<V> = {
  readonly headers: V;
  readonly headersValidatorRaw: RequestW['headers'] | undefined;
};

const toMiddlewareError = (error: SchemaValidationError): MiddlewareError =>
  middlewareError(error.message, error.cause === undefined ? error.issues : [error.cause, ...error.issues]);

export const middleware =
  <V>(schema: StandardSchemaV1<unknown, V>) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<Override<I, WithValidatedHeaders<V>>, R, O, E>
  ): RequestResponseHandler<I, R & WithLogger, O, E | MiddlewareError> =>
  (i: RequestW<I>) =>
    pipe(
      okAsyncR(i.headers),
      tapLogger('debug', `[${TAG}] IN`),
      andThenParseAsyncR(schema, { message: 'Headers validation failed' }),
      mapErrAsync(toMiddlewareError),
      mapAsync((validatedHeaders) =>
        makeRequestW(i, {
          headers: validatedHeaders,
          headersValidatorRaw: i.headers,
        })
      ),
      andThenAsync(wrapped),
      mapAsync((res) => makeResponseW(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
