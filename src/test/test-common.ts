import * as P from '@konker.dev/effect-ts-prelude';

import type { BaseResponse } from '../lib/http';

export type TestDeps = any;
export const TestDeps = P.Context.GenericTag<any>('Deps');

// TODO: type annotation comment
export function echoCoreIn<I>(i: I): P.Effect.Effect<I, never, never> {
  return P.Effect.succeed(i);
}

// TODO: type annotation comment
export const echoCoreInDeps =
  <I, E, R>(Deps: P.Context.Tag<R, R>) =>
  (i: I): P.Effect.Effect<unknown, E, R> => {
    return P.pipe(
      Deps,
      P.Effect.map((deps) => ({
        ...i,
        ...deps,
      }))
    );
  };

// TODO: type annotation comment
export function http200CoreIn<I>(_i: I): P.Effect.Effect<BaseResponse> {
  return P.Effect.succeed({
    statusCode: 200,
    headers: { QUX: 'qux_value' },
    body: JSON.stringify({ result: 'OK' }),
    isBase64Encoded: false,
  });
}
