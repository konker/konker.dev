/**
 * Sync→async bridge operators that take a `ResultR` and return a
 * `ResultAsyncR`: `asyncMap`, `asyncAndThen`, `asyncAndThrough`. They follow
 * the same `R1 & R2` intersection rule as the pure sync/async operators,
 * promoting the chain to the async track.
 *
 * @module
 */

import type { ResultAsyncR, ResultR } from './types.js';

export const asyncMap =
  <A, B>(f: (a: A) => Promise<B>) =>
  <R, E>(rr: ResultR<R, A, E>): ResultAsyncR<R, B, E> =>
  (r) =>
    rr(r).asyncMap(f);

export const asyncAndThen =
  <A, R2, B, E2>(f: (a: A) => ResultAsyncR<R2, B, E2>) =>
  <R1, E1>(rr: ResultR<R1, A, E1>): ResultAsyncR<R1 & R2, B, E1 | E2> =>
  (r) =>
    rr(r).asyncAndThen((a) => f(a)(r));

export const asyncAndThrough =
  <T, R2, F>(f: (t: T) => ResultAsyncR<R2, unknown, F>) =>
  <R1, E>(rr: ResultR<R1, T, E>): ResultAsyncR<R1 & R2, T, E | F> =>
  (r) =>
    rr(r).asyncAndThrough((t) => f(t)(r));
