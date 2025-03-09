import type { FetchEffect } from '../index.js';

/**
 * A FetchEffect middleware which does nothing. Used as the most trivial example of a middleware.
 */
export const IdentityMiddleware =
  <I1 extends RequestInit, R1 extends Response>(fn: FetchEffect<I1, R1>): FetchEffect<I1, R1> =>
  (url: URL | string, init: Partial<I1> = {}) => {
    return fn(url, init);
  };
