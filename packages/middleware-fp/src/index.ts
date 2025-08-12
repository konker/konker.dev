import type { Effect } from 'effect';

export type Handler<I, O, E, R> = (i: I) => Effect.Effect<O, E, R>;
