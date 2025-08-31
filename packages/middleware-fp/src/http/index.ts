import { Effect } from 'effect';

import type { Handler } from '../index.js';
import type { RequestW } from './request.js';
import type { ResponseW } from './response.js';

// --------------------------------------------------------------------------
export const UNKNOWN_STRING_EFFECT = <E, R>(): Effect.Effect<string, E, R> => Effect.succeed('UNKNOWN');

export type Rec = Record<string, unknown>;

// --------------------------------------------------------------------------
export type RequestResponseHandler<I extends Rec, O extends Rec, E, R> = Handler<RequestW<I>, ResponseW<O>, E, R>;
