import type { Rec, RequestResponseHandler } from '../RequestResponseHandler.js';

export const TAG = 'identity';

export const middleware =
  (_params?: never) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, R, O, E>
  ): RequestResponseHandler<I, R, O, E> =>
    wrapped;
