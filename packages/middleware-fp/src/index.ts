import type { Effect } from 'effect';

import type { RequestW, ResponseW } from './lib/http.js';

export type Rec = Record<string, unknown>;

export type Handler<I, O, E, R> = (i: I) => Effect.Effect<O, E, R>;

export type RequestResponseHandler<I extends Rec, O extends Rec, E, R> = Handler<RequestW<I>, ResponseW<O>, E, R>;
