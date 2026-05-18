import { Buffer } from 'node:buffer';

import { andThenAsync } from '@konker.dev/neverthrow-r/async';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';
import type { HonoRequest } from 'hono';
import { ResultAsync } from 'neverthrow';

import type { Handler } from '../../handler.js';
import type { WithLogger } from '../../lib/Logger.js';
import { tapLogger } from '../../lib/Logger.js';
import type { MiddlewareError } from '../../lib/MiddlewareError.js';
import { toMiddlewareError } from '../../lib/MiddlewareError.js';
import { sanitizeRecord } from '../../lib/utils.js';
import type { StrBodyRec } from '../RequestResponseHandler.js';
import type { RequestW } from '../RequestW.js';
import type { ResponseW } from '../ResponseW.js';

export const TAG = 'honoAdapter';

export type WithHonoRequestRaw = {
  readonly honoRequestRaw: HonoRequest;
};

export function adaptFromHonoRequest(request: HonoRequest): ResultAsync<RequestW<WithHonoRequestRaw>, MiddlewareError> {
  return ResultAsync.fromPromise(
    (async () => ({
      url: request.url,
      method: request.method,
      body: await request.text(),
      headers: sanitizeRecord(request.header()),
      queryStringParameters: sanitizeRecord(request.query()),
      pathParameters: sanitizeRecord(request.param()),
      honoRequestRaw: request,
    }))(),
    toMiddlewareError
  );
}

export function adaptToHonoResponse<O extends StrBodyRec>(
  responseW: ResponseW<O>
): ResultAsync<Response, MiddlewareError> {
  return ResultAsync.fromPromise(
    (async () =>
      new Response(Buffer.from(responseW.body ?? ''), {
        status: responseW.statusCode,
        headers: new Headers(responseW.headers),
      }))(),
    toMiddlewareError
  );
}

export const middleware =
  (_params?: never) =>
  <O extends StrBodyRec, E, R>(
    wrapped: Handler<RequestW<WithHonoRequestRaw>, ResponseW<O>, E, R>
  ): Handler<HonoRequest, Response, E | MiddlewareError, R & WithLogger> =>
  (i: HonoRequest) =>
    pipe(
      okAsyncR<HonoRequest>(i),
      tapLogger('debug', `[${TAG}] IN`),
      andThenAsync(() => (_r: unknown) => adaptFromHonoRequest(i)),
      andThenAsync(wrapped),
      andThenAsync((res) => (_r: unknown) => adaptToHonoResponse(res)),
      tapLogger('debug', `[${TAG}] OUT`)
    );
