import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';

export type Deps = any;
export const Deps = P.Context.GenericTag<any>('Deps');

export function _echoCoreIn<I, E, D>(i: I): P.Effect.Effect<I, E, D> {
  return P.Effect.succeed(i);
}
export const echoCoreIn: Handler<any, any, any, any> = _echoCoreIn;

export const _echoCoreInDeps =
  <E, D, I>(Deps: P.Context.Tag<D, D>) =>
  (i: I): P.Effect.Effect<unknown, E, D> => {
    return P.pipe(
      Deps,
      P.Effect.map((deps) => ({
        ...i,
        ...deps,
      }))
    );
  };
export const echoCoreInDeps: <D = Deps>(deps: P.Context.Tag<D, D>) => Handler<object, any, any, D> = _echoCoreInDeps;
