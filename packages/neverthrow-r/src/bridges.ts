/**
 * Sync→async bridge operators: take a `ResultR` and return a `ResultAsyncR`,
 * promoting the chain onto the async track mid-pipeline.
 *
 * @remarks
 * Reach for this module when a chain that starts synchronously needs to
 * await — typically an I/O call partway through. Three flavours, mirroring
 * the corresponding sync combinators but lifting the operand into
 * `ResultAsyncR`:
 *
 * - {@link asyncMap} — promote via a `Promise`-returning transform.
 * - {@link asyncAndThen} — promote via a `ResultAsyncR`-returning step.
 * - {@link asyncAndThrough} — promote via a fallible async tee.
 *
 * Every step *after* the bridge must come from {@link async} (the
 * `*Async`-suffixed combinators); there is no async→sync bridge.
 *
 * @example
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { mapAsync } from '@konker.dev/neverthrow-r/async';
 * import { asyncMap } from '@konker.dev/neverthrow-r/bridges';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(
 *   okR<number>(2),
 *   asyncMap(async (n) => n + 1),   // sync → async here
 *   mapAsync(async (n) => n * 10),  // continue async
 * );
 *
 * program(undefined); // ResultAsync resolving to Ok(30)
 * ```
 *
 * @module
 */

import type { ResultAsyncR, ResultR } from './types.js';

/**
 * Promotes a `ResultR` to a `ResultAsyncR` by applying a `Promise`-returning
 * transform to the success value.
 *
 * @remarks
 * The sync→async sibling of {@link map}. After this step the chain is async;
 * follow with {@link mapAsync}, {@link andThenAsync}, etc.
 *
 * @typeParam A - The input success type.
 * @typeParam B - The output success type.
 *
 * @param f - `Promise`-returning transform from `A` to `B`.
 *
 * @example
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { asyncMap } from '@konker.dev/neverthrow-r/bridges';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(okR<number>(2), asyncMap(async (n) => n * 2));
 * program(undefined); // ResultAsync resolving to Ok(4)
 * ```
 *
 * @see {@link map}
 * @see {@link mapAsync}
 */
export const asyncMap =
  <A, B>(f: (a: A) => Promise<B>) =>
  <R, E>(rr: ResultR<R, A, E>): ResultAsyncR<R, B, E> =>
  (r) =>
    rr(r).asyncMap(f);

/**
 * Promotes a `ResultR` to a `ResultAsyncR` by chaining a
 * `ResultAsyncR`-returning step.
 *
 * @remarks
 * Sync→async sibling of {@link andThen}. The continuation's requirements
 * `R2` are intersected (`R1 & R2`); its error type `E2` is unioned
 * (`E1 | E2`).
 *
 * @typeParam A - The previous step's success type.
 * @typeParam R2 - The continuation's requirements.
 * @typeParam B - The continuation's success type.
 * @typeParam E2 - The continuation's error type.
 *
 * @param f - Function from the previous success value to a `ResultAsyncR`.
 *
 * @example
 * ```ts
 * import { okAsyncR, okR } from '@konker.dev/neverthrow-r/constructors';
 * import { asyncAndThen } from '@konker.dev/neverthrow-r/bridges';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(
 *   okR<number>(2),
 *   asyncAndThen((n) => okAsyncR<string>(`got ${n}`)),
 * );
 *
 * program(undefined); // ResultAsync resolving to Ok('got 2')
 * ```
 *
 * @see {@link andThen}
 * @see {@link andThenAsync}
 */
export const asyncAndThen =
  <A, R2, B, E2>(f: (a: A) => ResultAsyncR<R2, B, E2>) =>
  <R1, E1>(rr: ResultR<R1, A, E1>): ResultAsyncR<R1 & R2, B, E1 | E2> =>
  (r) =>
    rr(r).asyncAndThen((a) => f(a)(r));

/**
 * Promotes a `ResultR` to a `ResultAsyncR` via a fallible async tee that
 * propagates the *original* success value.
 *
 * @remarks
 * Sync→async sibling of {@link andThrough}. The tee step is itself a
 * `ResultAsyncR` that can fail; on success its value is discarded and the
 * chain continues with the original success value.
 *
 * @typeParam T - The success type (preserved through the step on success).
 * @typeParam R2 - The tee's requirements.
 * @typeParam F - The tee's error type.
 *
 * @param f - Function from the success value to a `ResultAsyncR` whose value
 *   is ignored on success.
 *
 * @example
 * ```ts
 * import { okAsyncR, okR } from '@konker.dev/neverthrow-r/constructors';
 * import { asyncAndThrough } from '@konker.dev/neverthrow-r/bridges';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(
 *   okR<number>(2),
 *   asyncAndThrough((n) => okAsyncR<unknown>(`logged ${n}`)),
 * );
 *
 * program(undefined); // ResultAsync resolving to Ok(2)
 * ```
 *
 * @see {@link andThrough}
 * @see {@link andThroughAsync}
 */
export const asyncAndThrough =
  <T, R2, F>(f: (t: T) => ResultAsyncR<R2, unknown, F>) =>
  <R1, E>(rr: ResultR<R1, T, E>): ResultAsyncR<R1 & R2, T, E | F> =>
  (r) =>
    rr(r).asyncAndThrough((t) => f(t)(r));
