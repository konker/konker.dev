/**
 * Sync combinators over `ResultR`. This is the canonical surface — the async
 * module ({@link mapAsync}, {@link andThenAsync}, …) mirrors it 1:1 over
 * `ResultAsyncR`.
 *
 * @remarks
 * Every combinator is curried so it composes cleanly under {@link pipe}: the
 * transforming function comes first, then the operand `ResultR`. Each one
 * delegates to the corresponding neverthrow `Result` method, threading the
 * environment `r` through and **intersecting** requirements across composed
 * steps (`R1 & R2`).
 *
 * Reach for this module when the whole chain is synchronous. The moment a
 * step needs to await, switch into {@link bridges} (sync→async one-shot) or
 * the {@link async} module (already-async chain).
 *
 * @example
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { andThen, map } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(
 *   okR<number>(2),
 *   map((n) => n + 1),
 *   andThen((n) => okR<string>(`got ${n}`)),
 * );
 *
 * program(undefined); // Ok('got 3')
 * ```
 *
 * @module
 */

import type { ResultR } from './types.js';

/**
 * Transforms the success value of a `ResultR` with a pure function.
 *
 * @remarks
 * Threads `R` and `E` through unchanged; only `T` changes. The wrapped
 * function `f` is not called when the underlying `Result` is an `Err`.
 *
 * To transform the error channel instead, see {@link mapErr}. To compose
 * with another `ResultR`-returning step, use {@link andThen}. For side
 * effects on the success value without changing it, use {@link andTee}.
 *
 * @typeParam A - The input success type.
 * @typeParam B - The output success type.
 *
 * @param f - Pure transformation from `A` to `B`.
 * @returns A function taking a `ResultR<R, A, E>` and returning a
 *   `ResultR<R, B, E>`.
 *
 * @example
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { map } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const doubled = pipe(okR<number>(2), map((n) => n * 2));
 * doubled(undefined); // Ok(4)
 * ```
 *
 * @see {@link mapErr}
 * @see {@link andThen}
 * @see {@link mapAsync}
 */
export const map =
  <A, B>(f: (a: A) => B) =>
  <R, E>(rr: ResultR<R, A, E>): ResultR<R, B, E> =>
  (r) =>
    rr(r).map(f);

/**
 * Transforms the error value of a `ResultR` with a pure function.
 *
 * @remarks
 * Symmetric to {@link map}, but operates on the `E` channel. `T` and `R` pass
 * through unchanged. Useful for narrowing a wide error type to a domain-
 * specific one, or for annotating where in a pipeline an error occurred.
 *
 * @typeParam E - The input error type.
 * @typeParam F - The output error type.
 *
 * @param f - Pure transformation from `E` to `F`.
 *
 * @example
 * ```ts
 * import { errR } from '@konker.dev/neverthrow-r/constructors';
 * import { mapErr } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const annotated = pipe(
 *   errR<string>('not found'),
 *   mapErr((msg) => ({ tag: 'lookup', message: msg })),
 * );
 *
 * annotated(undefined); // Err({ tag: 'lookup', message: 'not found' })
 * ```
 *
 * @see {@link map}
 * @see {@link mapErrAsync}
 */
export const mapErr =
  <E, F>(f: (e: E) => F) =>
  <R, T>(rr: ResultR<R, T, E>): ResultR<R, T, F> =>
  (r) =>
    rr(r).mapErr(f);

/**
 * Chains another `ResultR`-returning step onto a successful result.
 *
 * @remarks
 * This is the workhorse for sequencing computations that each may fail. The
 * continuation `f` receives the previous step's success value and returns a
 * new `ResultR` whose requirements `R2` are **intersected** into the chain
 * (`R1 & R2`) and whose error type `E2` is **unioned** with the chain's
 * (`E1 | E2`).
 *
 * If the previous step is an `Err`, `f` is not called and the error
 * propagates.
 *
 * For multi-step chains that accumulate intermediate values into a named
 * scope, prefer the do-notation helpers in {@link do}.
 *
 * @typeParam A - The previous step's success type.
 * @typeParam R2 - The continuation's requirements.
 * @typeParam B - The continuation's success type.
 * @typeParam E2 - The continuation's error type.
 *
 * @param f - Function from the previous success value to a `ResultR`.
 * @returns A function taking a `ResultR<R1, A, E1>` and returning a
 *   `ResultR<R1 & R2, B, E1 | E2>`.
 *
 * @example
 * ```ts
 * import { asks, okR } from '@konker.dev/neverthrow-r/constructors';
 * import { andThen } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * type Config = { factor: number };
 *
 * const program = pipe(
 *   okR<number>(2),
 *   andThen((n) => asks((r: Config) => n * r.factor)),
 * );
 *
 * program({ factor: 10 }); // Ok(20)
 * ```
 *
 * @see {@link orElse} for the error-channel mirror.
 * @see {@link andThrough} for a chain that returns the previous value.
 * @see {@link andThenAsync}
 * @see {@link bindR}
 */
export const andThen =
  <A, R2, B, E2>(f: (a: A) => ResultR<R2, B, E2>) =>
  <R1, E1>(rr: ResultR<R1, A, E1>): ResultR<R1 & R2, B, E1 | E2> =>
  (r) =>
    rr(r).andThen((a) => f(a)(r));

/**
 * Recovers from an `Err` by running another `ResultR`-returning step.
 *
 * @remarks
 * The error-channel mirror of {@link andThen}: `f` is called only when the
 * previous step is an `Err`. The recovery's requirements `R2` are intersected
 * (`R1 & R2`) and its success type `U` is unioned with the original `T`
 * (`T | U`). The recovery itself can still fail, with its own error type `F`.
 *
 * @typeParam E - The previous step's error type.
 * @typeParam R2 - The recovery's requirements.
 * @typeParam U - The recovery's success type.
 * @typeParam F - The recovery's error type.
 *
 * @param f - Function from the previous error to a recovery `ResultR`.
 *
 * @example
 * ```ts
 * import { errR, okR } from '@konker.dev/neverthrow-r/constructors';
 * import { orElse } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const withFallback = pipe(
 *   errR<string, number>('boom'),
 *   orElse(() => okR<number>(0)),
 * );
 *
 * withFallback(undefined); // Ok(0)
 * ```
 *
 * @see {@link andThen}
 * @see {@link orElseAsync}
 */
export const orElse =
  <E, R2, U, F>(f: (e: E) => ResultR<R2, U, F>) =>
  <R1, T>(rr: ResultR<R1, T, E>): ResultR<R1 & R2, T | U, F> =>
  (r) =>
    rr(r).orElse((e) => f(e)(r));

/**
 * Eliminates a `ResultR` into a single value by handling both branches.
 *
 * @remarks
 * Unlike the other combinators, `match` does not return a `ResultR` — it
 * collapses the chain into a plain value. Both branch functions can return
 * the same type, or different types that get unioned.
 *
 * The result is still a function of the environment `R`, so calling it
 * requires providing `R` directly (or pulling it via {@link provide}).
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @typeParam A - The result type of the `Ok` branch.
 * @typeParam B - The result type of the `Err` branch (defaults to `A`).
 *
 * @param okFn - Handler for the success branch.
 * @param errFn - Handler for the error branch.
 *
 * @example
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { match } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const rendered = pipe(
 *   okR<number>(42),
 *   match(
 *     (n) => `got ${n}`,
 *     (e: never) => `error: ${String(e)}`,
 *   ),
 * );
 *
 * rendered(undefined); // 'got 42'
 * ```
 *
 * @see {@link matchAsync}
 */
export const match =
  <T, E, A, B = A>(okFn: (t: T) => A, errFn: (e: E) => B) =>
  <R>(rr: ResultR<R, T, E>) =>
  (r: R): A | B =>
    rr(r).match(okFn, errFn);

/**
 * Runs a side effect with the success value, propagating the value unchanged.
 *
 * @remarks
 * Pass-through combinator for logging, telemetry, or any other observe-only
 * step. The callback's return value is discarded; the chain continues with
 * the original `T`. The callback is not invoked when the chain is in `Err`.
 *
 * @typeParam T - The success type (preserved through the step).
 *
 * @param f - Side-effecting callback receiving the success value.
 *
 * @example
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { andTee } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const traced = pipe(
 *   okR<number>(2),
 *   andTee((n) => console.log('saw', n)),
 * );
 *
 * traced(undefined); // logs 'saw 2', returns Ok(2)
 * ```
 *
 * @see {@link orTee}
 * @see {@link andThrough} for a tee that can itself fail.
 * @see {@link andTeeAsync}
 */
export const andTee =
  <T>(f: (t: T) => unknown) =>
  <R, E>(rr: ResultR<R, T, E>): ResultR<R, T, E> =>
  (r) =>
    rr(r).andTee(f);

/**
 * Runs a side effect with the error value, propagating the error unchanged.
 *
 * @remarks
 * Error-channel mirror of {@link andTee}. Useful for logging failures without
 * altering the error type or recovering from it.
 *
 * @typeParam E - The error type (preserved through the step).
 *
 * @param f - Side-effecting callback receiving the error value.
 *
 * @example
 * ```ts
 * import { errR } from '@konker.dev/neverthrow-r/constructors';
 * import { orTee } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const logged = pipe(
 *   errR<string>('boom'),
 *   orTee((e) => console.error('failed:', e)),
 * );
 *
 * logged(undefined); // logs 'failed: boom', returns Err('boom')
 * ```
 *
 * @see {@link andTee}
 * @see {@link orTeeAsync}
 */
export const orTee =
  <E>(f: (e: E) => unknown) =>
  <R, T>(rr: ResultR<R, T, E>): ResultR<R, T, E> =>
  (r) =>
    rr(r).orTee(f);

/**
 * Runs a fallible step for its side effect, then propagates the original
 * success value if the step succeeds.
 *
 * @remarks
 * Like {@link andTee}, but the tee step is itself a `ResultR` that can fail.
 * If the tee step returns `Err`, that error replaces the chain's value; if it
 * returns `Ok`, the chain continues with the *original* success value (the
 * tee's success value is discarded).
 *
 * Common shape: validate a value via a fallible check without losing the
 * value itself.
 *
 * @typeParam T - The success type (preserved through the step on success).
 * @typeParam R2 - The tee's requirements (intersected into the chain).
 * @typeParam F - The tee's error type (unioned with the chain's).
 *
 * @param f - Function from the success value to a `ResultR` whose value is
 *   ignored on success.
 *
 * @example
 * ```ts
 * import { errR, okR } from '@konker.dev/neverthrow-r/constructors';
 * import { andThrough } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const validated = pipe(
 *   okR<number>(2),
 *   andThrough((n) => (n > 0 ? okR<unknown>(undefined) : errR<string>('non-positive'))),
 * );
 *
 * validated(undefined); // Ok(2)
 * ```
 *
 * @see {@link andTee} for the infallible version.
 * @see {@link andThroughAsync}
 */
export const andThrough =
  <T, R2, F>(f: (t: T) => ResultR<R2, unknown, F>) =>
  <R1, E>(rr: ResultR<R1, T, E>): ResultR<R1 & R2, T, E | F> =>
  (r) =>
    rr(r).andThrough((t) => f(t)(r));
