import { Buffer } from 'node:buffer';

import { andThenAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';

import type { Handler } from '../../handler.js';
import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import { fromPromise, sanitizeRecord } from '../../lib/utils.js';
import type { StrBodyRec } from '../RequestResponseHandler.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

export const TAG = 'standardRequestResponseAdapter';

export type WithStandardRequestRaw = {
  readonly fetchRequestRaw: Request;
};

export function adaptFromStandardRequest(request: Request) {
  return fromPromise(
    async (): Promise<RequestW<WithStandardRequestRaw & StrBodyRec>> => ({
      url: request.url,
      method: request.method,
      body: await request.text(),
      headers: sanitizeRecord(Object.fromEntries(request.headers?.entries() ?? [])),
      queryStringParameters: sanitizeRecord(Object.fromEntries(new URL(request.url).searchParams.entries())),
      pathParameters: {},
      fetchRequestRaw: request,
    }),
    toMiddlewareError
  );
}

export function adaptToStandardResponse<O extends StrBodyRec>(responseW: ResponseW<O>) {
  return fromPromise(
    async (): Promise<Response> =>
      new Response(Buffer.from(responseW.body ?? ''), {
        status: responseW.statusCode,
        headers: new Headers(responseW.headers ?? {}),
      }),
    toMiddlewareError
  );
}

export const middleware =
  (_params?: never) =>
  <O extends StrBodyRec, E, R>(
    wrapped: Handler<RequestW<WithStandardRequestRaw & StrBodyRec>, R, ResponseW<O>, E>
  ): Handler<Request, R & WithLogger, Response, E | MiddlewareError> =>
  (i: Request) =>
    pipe(
      okAsyncR(i),
      tapLogger('debug', `[${TAG}] IN`),
      andThenAsync((req) => () => adaptFromStandardRequest(req)),
      andThenAsync(wrapped),
      andThenAsync((res) => () => adaptToStandardResponse(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
