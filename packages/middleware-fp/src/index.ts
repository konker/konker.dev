import type { Effect } from 'effect';

export type Handler<I, O, E, R> = (i: I) => Effect.Effect<O, E, R>;

export type Middleware<WI, I, WO, O, WE, E, WR, R> = (wrapped: Handler<WI, WO, WE, WR>) => Handler<I, O, E, R>;
