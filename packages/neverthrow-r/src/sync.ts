/**
 * Sync operators over `ResultR`: `map`, `mapErr`, `andThen`, `orElse`,
 * `match`, `andTee`, `orTee`, `andThrough`. Each is a one-line delegation to
 * the underlying neverthrow `Result` method, threading the environment `r`
 * and intersecting requirement types (`R1 & R2`) across composed steps.
 *
 * @module
 */

import type { ResultR } from './types.js';

export const map =
  <A, B>(f: (a: A) => B) =>
  <R, E>(rr: ResultR<R, A, E>): ResultR<R, B, E> =>
  (r) =>
    rr(r).map(f);

export const mapErr =
  <E, F>(f: (e: E) => F) =>
  <R, T>(rr: ResultR<R, T, E>): ResultR<R, T, F> =>
  (r) =>
    rr(r).mapErr(f);

export const andThen =
  <A, R2, B, E2>(f: (a: A) => ResultR<R2, B, E2>) =>
  <R1, E1>(rr: ResultR<R1, A, E1>): ResultR<R1 & R2, B, E1 | E2> =>
  (r) =>
    rr(r).andThen((a) => f(a)(r));

export const orElse =
  <E, R2, U, F>(f: (e: E) => ResultR<R2, U, F>) =>
  <R1, T>(rr: ResultR<R1, T, E>): ResultR<R1 & R2, T | U, F> =>
  (r) =>
    rr(r).orElse((e) => f(e)(r));

export const match =
  <T, E, A, B = A>(okFn: (t: T) => A, errFn: (e: E) => B) =>
  <R>(rr: ResultR<R, T, E>) =>
  (r: R): A | B =>
    rr(r).match(okFn, errFn);

export const andTee =
  <T>(f: (t: T) => unknown) =>
  <R, E>(rr: ResultR<R, T, E>): ResultR<R, T, E> =>
  (r) =>
    rr(r).andTee(f);

export const orTee =
  <E>(f: (e: E) => unknown) =>
  <R, T>(rr: ResultR<R, T, E>): ResultR<R, T, E> =>
  (r) =>
    rr(r).orTee(f);

export const andThrough =
  <T, R2, F>(f: (t: T) => ResultR<R2, unknown, F>) =>
  <R1, E>(rr: ResultR<R1, T, E>): ResultR<R1 & R2, T, E | F> =>
  (r) =>
    rr(r).andThrough((t) => f(t)(r));
