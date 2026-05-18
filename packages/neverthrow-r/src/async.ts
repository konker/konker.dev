/**
 * Async operators over `ResultAsyncR`: `mapAsync`, `mapErrAsync`,
 * `andThenAsync`, `orElseAsync`, `matchAsync`, `andTeeAsync`, `orTeeAsync`,
 * `andThroughAsync`. Mirror the sync surface from `./sync`, suffixed with
 * `Async` to avoid barrel collisions, and delegate to the corresponding
 * neverthrow `ResultAsync` methods.
 *
 * @module
 */

import type { ResultAsyncR } from './types.js';

export const mapAsync =
  <A, B>(f: (a: A) => B | Promise<B>) =>
  <R, E>(rr: ResultAsyncR<R, A, E>): ResultAsyncR<R, B, E> =>
  (r) =>
    rr(r).map(f);

export const mapErrAsync =
  <E, F>(f: (e: E) => F | Promise<F>) =>
  <R, T>(rr: ResultAsyncR<R, T, E>): ResultAsyncR<R, T, F> =>
  (r) =>
    rr(r).mapErr(f);

export const andThenAsync =
  <A, R2, B, E2>(f: (a: A) => ResultAsyncR<R2, B, E2>) =>
  <R1, E1>(rr: ResultAsyncR<R1, A, E1>): ResultAsyncR<R1 & R2, B, E1 | E2> =>
  (r) =>
    rr(r).andThen((a) => f(a)(r));

export const orElseAsync =
  <E, R2, U, F>(f: (e: E) => ResultAsyncR<R2, U, F>) =>
  <R1, T>(rr: ResultAsyncR<R1, T, E>): ResultAsyncR<R1 & R2, T | U, F> =>
  (r) =>
    rr(r).orElse((e) => f(e)(r));

export const matchAsync =
  <T, E, A, B = A>(okFn: (t: T) => A, errFn: (e: E) => B) =>
  <R>(rr: ResultAsyncR<R, T, E>) =>
  async (r: R): Promise<A | B> =>
    rr(r).match(okFn, errFn);

export const andTeeAsync =
  <T>(f: (t: T) => unknown) =>
  <R, E>(rr: ResultAsyncR<R, T, E>): ResultAsyncR<R, T, E> =>
  (r) =>
    rr(r).andTee(f);

export const orTeeAsync =
  <E>(f: (e: E) => unknown) =>
  <R, T>(rr: ResultAsyncR<R, T, E>): ResultAsyncR<R, T, E> =>
  (r) =>
    rr(r).orTee(f);

export const andThroughAsync =
  <T, R2, F>(f: (t: T) => ResultAsyncR<R2, unknown, F>) =>
  <R1, E>(rr: ResultAsyncR<R1, T, E>): ResultAsyncR<R1 & R2, T, E | F> =>
  (r) =>
    rr(r).andThrough((t) => f(t)(r));
