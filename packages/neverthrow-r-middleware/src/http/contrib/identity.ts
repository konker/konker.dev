import type { Rec, RequestResponseHandler } from '../RequestResponseHandler.js';

export const TAG = 'identity';

export const middleware =
  (_params?: never) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E, R> =>
    wrapped;
