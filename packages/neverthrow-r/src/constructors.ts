/**
 * Entry points for building `ResultR` / `ResultAsyncR` values from scratch or
 * from existing `neverthrow` values. Use these where a pipeline starts.
 *
 * @remarks
 * - {@link okR} / {@link errR} / {@link okAsyncR} / {@link errAsyncR} — lift a
 *   plain value (or error) into a `ResultR` / `ResultAsyncR` with no
 *   requirements (`R = unknown`).
 * - {@link fromResult} / {@link fromResultAsync} — lift an existing neverthrow
 *   `Result` / `ResultAsync` into the `R`-channel layer with no requirements.
 * - {@link asks} / {@link ask} — build a `ResultR` whose only effect is to
 *   read from the environment, declaring `R` in the process.
 *
 * Any non-trivial requirements (a database handle, a clock, …) are introduced
 * with `asks`; the rest of the pipeline picks them up via intersection in
 * `andThen`-style operators.
 *
 * @example
 * ```ts
 * import { asks, okR } from '@konker.dev/neverthrow-r/constructors';
 * import { andThen, map } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * type Clock = { now: () => Date };
 *
 * const year = asks((r: Clock) => r.now().getFullYear());
 *
 * const program = pipe(
 *   okR<number>(2024),
 *   map((n) => n + 1),
 *   andThen(() => year),
 * );
 * ```
 *
 * @module
 */

import type { Result, ResultAsync } from 'neverthrow';
import { err, errAsync, ok, okAsync } from 'neverthrow';

import type { ResultAsyncR, ResultR } from './types.js';

/**
 * Lifts a plain success value into a `ResultR` with no requirements.
 *
 * @remarks
 * Equivalent to `() => ok(value)`. The `R` parameter defaults to `unknown`
 * because the constructor doesn't read from the environment.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type (defaults to `never` since this always
 *   succeeds).
 *
 * @param value - The value to wrap in an `Ok`.
 * @returns A `ResultR<unknown, T, E>` that ignores its environment and yields
 *   `Ok(value)`.
 *
 * @example
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 *
 * const two = okR<number>(2);
 * two(undefined); // Ok(2)
 * ```
 *
 * @see {@link errR}
 * @see {@link okAsyncR}
 */
export const okR =
  <T, E = never>(value: T): ResultR<unknown, T, E> =>
  () =>
    ok(value);

/**
 * Lifts a plain error value into a `ResultR` with no requirements.
 *
 * @typeParam E - The error type.
 * @typeParam T - The success type (defaults to `never` since this always
 *   fails).
 *
 * @param error - The error value to wrap in an `Err`.
 *
 * @example
 * ```ts
 * import { errR } from '@konker.dev/neverthrow-r/constructors';
 *
 * const fail = errR<string>('boom');
 * fail(undefined); // Err('boom')
 * ```
 *
 * @see {@link okR}
 * @see {@link errAsyncR}
 */
export const errR =
  <E, T = never>(error: E): ResultR<unknown, T, E> =>
  () =>
    err(error);

/**
 * Async sibling of {@link okR}: lifts a plain success value into a
 * `ResultAsyncR` with no requirements.
 *
 * @example
 * ```ts
 * import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 *
 * const program = okAsyncR<number>(2);
 * program(undefined); // ResultAsync resolving to Ok(2)
 * ```
 *
 * @see {@link okR}
 */
export const okAsyncR =
  <T, E = never>(value: T): ResultAsyncR<unknown, T, E> =>
  () =>
    okAsync(value);

/**
 * Async sibling of {@link errR}: lifts a plain error value into a
 * `ResultAsyncR` with no requirements.
 *
 * @example
 * ```ts
 * import { errAsyncR } from '@konker.dev/neverthrow-r/constructors';
 *
 * const fail = errAsyncR<string>('boom');
 * fail(undefined); // ResultAsync resolving to Err('boom')
 * ```
 *
 * @see {@link errR}
 */
export const errAsyncR =
  <E, T = never>(error: E): ResultAsyncR<unknown, T, E> =>
  () =>
    errAsync(error);

/**
 * Lifts an existing neverthrow `Result<T, E>` into a `ResultR<unknown, T, E>`.
 *
 * @remarks
 * Useful at the seam where existing neverthrow-using code is being adapted
 * into a pipeline that wants the `R` channel — wrap the legacy value once and
 * compose normally thereafter.
 *
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 *
 * @param r - The existing `Result` to lift.
 *
 * @example
 * ```ts
 * import { ok } from 'neverthrow';
 * import { fromResult } from '@konker.dev/neverthrow-r/constructors';
 *
 * const existing = ok<number, string>(42);
 * const lifted = fromResult(existing);
 * lifted(undefined); // Ok(42)
 * ```
 *
 * @see {@link fromResultAsync}
 */
export const fromResult =
  <T, E>(r: Result<T, E>): ResultR<unknown, T, E> =>
  () =>
    r;

/**
 * Async sibling of {@link fromResult}: lifts an existing `ResultAsync<T, E>`
 * into a `ResultAsyncR<unknown, T, E>`.
 *
 * @example
 * ```ts
 * import { okAsync } from 'neverthrow';
 * import { fromResultAsync } from '@konker.dev/neverthrow-r/constructors';
 *
 * const existing = okAsync<number, string>(42);
 * const lifted = fromResultAsync(existing);
 * lifted(undefined); // ResultAsync resolving to Ok(42)
 * ```
 *
 * @see {@link fromResult}
 */
export const fromResultAsync =
  <T, E>(ra: ResultAsync<T, E>): ResultAsyncR<unknown, T, E> =>
  () =>
    ra;

/**
 * Builds a `ResultR` whose value is computed from the environment. This is
 * how requirements are *introduced* into a chain.
 *
 * @remarks
 * `asks(f)` is equivalent to `(r) => ok(f(r))`. The argument's parameter type
 * fixes the `R` channel for the rest of the pipeline; downstream operators
 * intersect any further requirements.
 *
 * Use this when a step depends on something in the environment (a config
 * value, a service handle, the current time). For just reading the entire
 * environment unchanged, see {@link ask}.
 *
 * @typeParam R - The requirements (environment) read from.
 * @typeParam A - The value computed from the environment.
 *
 * @param f - A pure function from environment to value.
 *
 * @example
 * ```ts
 * import { asks } from '@konker.dev/neverthrow-r/constructors';
 *
 * type Config = { multiplier: number };
 *
 * const multiplier = asks((r: Config) => r.multiplier);
 * multiplier({ multiplier: 10 }); // Ok(10)
 * ```
 *
 * @see {@link ask}
 */
export const asks =
  <R, A>(f: (r: R) => A): ResultR<R, A, never> =>
  (r) =>
    ok(f(r));

/**
 * Reads the entire environment as the success value.
 *
 * @remarks
 * Specialisation of {@link asks} with the identity function. Most useful when
 * a step wants the whole environment passed downstream — e.g. to forward it
 * into a sub-pipeline.
 *
 * @typeParam R - The requirements (environment), surfaced as the success type.
 *
 * @example
 * ```ts
 * import { ask } from '@konker.dev/neverthrow-r/constructors';
 *
 * type Config = { multiplier: number };
 *
 * const env = ask<Config>();
 * env({ multiplier: 10 }); // Ok({ multiplier: 10 })
 * ```
 *
 * @see {@link asks}
 */
export const ask = <R>(): ResultR<R, R, never> => asks((r: R) => r);
