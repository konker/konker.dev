import type { Handler } from '../index';

export const middleware =
  <I, O, E, R>(_params?: never) =>
  (wrapped: Handler<I, O, E, R>): Handler<I, O, E, R> =>
    wrapped;
