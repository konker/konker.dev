import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { BaseResponse } from '../lib/http';

export type TestDeps = any;
export const TestDeps = Context.GenericTag<any>('Deps');

// TODO: type annotation comment
export function echoCoreIn<I>(i: I): Effect.Effect<I, never, never> {
  return Effect.succeed(i);
}

// TODO: type annotation comment
export const echoCoreInDeps =
  <I, E, R>(Deps: Context.Tag<R, R>) =>
  (i: I): Effect.Effect<unknown, E, R> => {
    return pipe(
      Deps,
      Effect.map((deps) => ({
        ...i,
        ...deps,
      }))
    );
  };

// TODO: type annotation comment
export function http200CoreIn<I>(_i: I): Effect.Effect<BaseResponse> {
  return Effect.succeed({
    statusCode: 200,
    headers: { QUX: 'qux_value' },
    body: JSON.stringify({ result: 'OK' }),
    isBase64Encoded: false,
  });
}
