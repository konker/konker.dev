import { Effect } from 'effect';

import type { Handler } from '../handler.js';
import type { RequestW } from './RequestW.js';
import type { ResponseW } from './ResponseW.js';

// --------------------------------------------------------------------------
export const UNKNOWN_STRING_EFFECT = <E, R>(): Effect.Effect<string, E, R> => Effect.succeed('UNKNOWN');

export type Rec = Record<string, unknown>;

export type BodyRec = Record<string, unknown> & { readonly body?: unknown };

export type StrBodyRec = Record<string, unknown> & { readonly body?: string };

// --------------------------------------------------------------------------
export type RequestResponseHandler<I extends Rec, O extends Rec, E, R> = Handler<RequestW<I>, ResponseW<O>, E, R>;
