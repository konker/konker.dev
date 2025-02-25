import { toError } from '@konker.dev/tiny-error-fp/lib';
import * as Effect from 'effect/Effect';

export function fetchEffect(url: URL | string, init: Partial<RequestInit> = {}): Effect.Effect<Response, Error> {
  return Effect.tryPromise({
    try: () => fetch(url, init),
    catch: toError,
  });
}

export type FetchEffect<I extends RequestInit, R extends Response> = (
  url: URL | string,
  init?: Partial<I>
) => Effect.Effect<R, Error>;

export type FetchEffectMiddleware<
  I1 extends RequestInit,
  R1 extends Response,
  I2 extends RequestInit = I1,
  R2 extends Response = R1,
> = (fn: FetchEffect<I1, R1>) => FetchEffect<I2, R2>;
