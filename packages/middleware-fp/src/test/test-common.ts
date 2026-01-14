import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { RequestW } from '../http/RequestW.js';
import { makeResponseW, type ResponseW } from '../http/ResponseW.js';

export type TestDepsW = any;
export const TestDepsW = Context.GenericTag<any>('DepsW');

// TODO: type annotation comment
export function echoCoreIn200W<I extends RequestW>(i: I): Effect.Effect<ResponseW<{ in: I }>> {
  return Effect.succeed(
    makeResponseW(
      {
        statusCode: 200,
        headers: {
          ...i.headers,
        },
        body: i.body ?? 'OK',
      },
      { in: i }
    )
  );
}

export function echoCoreInStrict200W<I extends RequestW>(i: I): Effect.Effect<ResponseW<{ in: I }>> {
  return Effect.succeed(
    makeResponseW(
      {
        statusCode: 200,
        headers: {
          ...i.headers,
        },
        body: i.body,
      },
      { in: i }
    )
  );
}

// TODO: type annotation comment
export const echoCoreInDepsW =
  <I extends RequestW, E, R>(Deps: Context.Tag<R, R>) =>
  (i: I): Effect.Effect<ResponseW<{ in: I; deps: R }>, E, R> => {
    return pipe(
      Deps,
      Effect.map((deps) =>
        makeResponseW(
          {
            statusCode: 200,
            headers: {
              ...i.headers,
            },
            body: i.body ?? 'OK',
          },
          { in: i, deps }
        )
      )
    );
  };
