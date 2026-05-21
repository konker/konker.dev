import type { Handler } from '../handler.js';
import type { Rec } from './Rec.js';
import type { RequestW } from './RequestW.js';
import type { ResponseW } from './ResponseW.js';

export type { BodyRec, Override, Rec, StrBodyRec } from './Rec.js';

export type RequestResponseHandler<I extends Rec, R, O extends Rec, E> = Handler<RequestW<I>, R, ResponseW<O>, E>;
