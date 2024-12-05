import type * as P from '@konker.dev/effect-ts-prelude';

export type Handler<I, O, E, R> = (i: I) => P.Effect.Effect<O, E, R>;

export type Middleware<WI, I, WO, O, WE, E, WR, R> = (wrapped: Handler<WI, WO, WE, WR>) => Handler<I, O, E, R>;
