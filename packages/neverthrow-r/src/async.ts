/**
 * Async combinators over `ResultAsyncR`, mirroring the sync surface from
 * {@link sync} 1:1. Each combinator is the `Async`-suffixed sibling of its
 * sync counterpart; semantics and type signatures match, lifted to
 * `ResultAsyncR`.
 *
 * @remarks
 * Cross-link to the sync module for the full prose on each combinator. The
 * docs here focus on the async-specific shape: each transformer accepts
 * `Promise`-returning functions, and the operand is a `ResultAsyncR`.
 *
 * Reach for this module when the chain is already async (e.g. it started
 * with {@link okAsyncR} or was promoted via {@link bridges}). To enter the
 * async track from a sync chain mid-pipeline, use {@link bridges} instead.
 *
 * @example
 * ```ts
 * import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { andThenAsync, mapAsync } from '@konker.dev/neverthrow-r/async';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(
 *   okAsyncR<number>(2),
 *   mapAsync(async (n) => n + 1),
 *   andThenAsync((n) => okAsyncR<string>(`got ${n}`)),
 * );
 *
 * program(undefined); // ResultAsync resolving to Ok('got 3')
 * ```
 *
 * @module
 */

import type { ResultAsyncR } from './types.js';

/**
 * Async variant of {@link map}. Accepts a sync- or `Promise`-returning
 * transform.
 *
 * @example
 * ```ts
 * import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { mapAsync } from '@konker.dev/neverthrow-r/async';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const doubled = pipe(okAsyncR<number>(2), mapAsync(async (n) => n * 2));
 * ```
 *
 * @see {@link map}
 */
export const mapAsync =
  <A, B>(f: (a: A) => B | Promise<B>) =>
  <R, E>(rr: ResultAsyncR<R, A, E>): ResultAsyncR<R, B, E> =>
  (r) =>
    rr(r).map(f);

/**
 * Async variant of {@link mapErr}. Accepts a sync- or `Promise`-returning
 * transform.
 *
 * @example
 * ```ts
 * import { errAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { mapErrAsync } from '@konker.dev/neverthrow-r/async';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const wrapped = pipe(
 *   errAsyncR<string>('boom'),
 *   mapErrAsync(async (msg) => ({ tag: 'fail' as const, msg })),
 * );
 * ```
 *
 * @see {@link mapErr}
 */
export const mapErrAsync =
  <E, F>(f: (e: E) => F | Promise<F>) =>
  <R, T>(rr: ResultAsyncR<R, T, E>): ResultAsyncR<R, T, F> =>
  (r) =>
    rr(r).mapErr(f);

/**
 * Async variant of {@link andThen}. The continuation returns a
 * `ResultAsyncR`; its requirements intersect into the chain.
 *
 * @example
 * ```ts
 * import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { andThenAsync } from '@konker.dev/neverthrow-r/async';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(
 *   okAsyncR<number>(2),
 *   andThenAsync((n) => okAsyncR<string>(`got ${n}`)),
 * );
 * ```
 *
 * @see {@link andThen}
 */
export const andThenAsync =
  <A, R2, B, E2>(f: (a: A) => ResultAsyncR<R2, B, E2>) =>
  <R1, E1>(rr: ResultAsyncR<R1, A, E1>): ResultAsyncR<R1 & R2, B, E1 | E2> =>
  (r) =>
    rr(r).andThen((a) => f(a)(r));

/**
 * Async variant of {@link orElse}. The recovery returns a `ResultAsyncR`.
 *
 * @example
 * ```ts
 * import { errAsyncR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { orElseAsync } from '@konker.dev/neverthrow-r/async';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const withFallback = pipe(
 *   errAsyncR<string, number>('boom'),
 *   orElseAsync(() => okAsyncR<number>(0)),
 * );
 * ```
 *
 * @see {@link orElse}
 */
export const orElseAsync =
  <E, R2, U, F>(f: (e: E) => ResultAsyncR<R2, U, F>) =>
  <R1, T>(rr: ResultAsyncR<R1, T, E>): ResultAsyncR<R1 & R2, T | U, F> =>
  (r) =>
    rr(r).orElse((e) => f(e)(r));

/**
 * Async variant of {@link match}. Returns a function from environment to a
 * `Promise` of the matched value.
 *
 * @example
 * ```ts
 * import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { matchAsync } from '@konker.dev/neverthrow-r/async';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const rendered = pipe(
 *   okAsyncR<number>(42),
 *   matchAsync(
 *     (n) => `got ${n}`,
 *     (e: never) => `error: ${String(e)}`,
 *   ),
 * );
 * // rendered(undefined) is Promise<string>
 * ```
 *
 * @see {@link match}
 */
export const matchAsync =
  <T, E, A, B = A>(okFn: (t: T) => A, errFn: (e: E) => B) =>
  <R>(rr: ResultAsyncR<R, T, E>) =>
  async (r: R): Promise<A | B> =>
    rr(r).match(okFn, errFn);

/**
 * Async variant of {@link andTee}.
 *
 * @example
 * ```ts
 * import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { andTeeAsync } from '@konker.dev/neverthrow-r/async';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const traced = pipe(okAsyncR<number>(2), andTeeAsync((n) => console.log(n)));
 * ```
 *
 * @see {@link andTee}
 */
export const andTeeAsync =
  <T>(f: (t: T) => unknown) =>
  <R, E>(rr: ResultAsyncR<R, T, E>): ResultAsyncR<R, T, E> =>
  (r) =>
    rr(r).andTee(f);

/**
 * Async variant of {@link orTee}.
 *
 * @example
 * ```ts
 * import { errAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { orTeeAsync } from '@konker.dev/neverthrow-r/async';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const logged = pipe(errAsyncR<string>('boom'), orTeeAsync((e) => console.error(e)));
 * ```
 *
 * @see {@link orTee}
 */
export const orTeeAsync =
  <E>(f: (e: E) => unknown) =>
  <R, T>(rr: ResultAsyncR<R, T, E>): ResultAsyncR<R, T, E> =>
  (r) =>
    rr(r).orTee(f);

/**
 * Async variant of {@link andThrough}.
 *
 * @example
 * ```ts
 * import { errAsyncR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { andThroughAsync } from '@konker.dev/neverthrow-r/async';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const validated = pipe(
 *   okAsyncR<number>(2),
 *   andThroughAsync((n) =>
 *     n > 0 ? okAsyncR<unknown>(undefined) : errAsyncR<string>('non-positive'),
 *   ),
 * );
 * ```
 *
 * @see {@link andThrough}
 */
export const andThroughAsync =
  <T, R2, F>(f: (t: T) => ResultAsyncR<R2, unknown, F>) =>
  <R1, E>(rr: ResultAsyncR<R1, T, E>): ResultAsyncR<R1 & R2, T, E | F> =>
  (r) =>
    rr(r).andThrough((t) => f(t)(r));
