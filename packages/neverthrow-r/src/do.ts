/**
 * Do-notation for `ResultR` / `ResultAsyncR`: chain steps that each bind a
 * value into a named scope, with the scope record carried through the chain
 * as the success type.
 *
 * @remarks
 * Two pairs of helpers:
 *
 * - {@link doR} / {@link doAsyncR} — seed a chain with an empty scope `{}`.
 * - {@link bindR} / {@link bindAsyncR} — add a named field by running a step
 *   that depends on the current scope, then attaching its result under a key.
 *
 * Use this in place of nested {@link andThen} when several intermediate
 * values are needed downstream. Requirements `R` intersect across steps; the
 * error channel unions; the success record grows with each `bind*`.
 *
 * @example
 * ```ts
 * import { asks, okR } from '@konker.dev/neverthrow-r/constructors';
 * import { bindR, doR } from '@konker.dev/neverthrow-r/do';
 * import { map } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * type Config = { greeting: string };
 *
 * const program = pipe(
 *   doR(),
 *   bindR('name', () => okR<string>('world')),
 *   bindR('greeting', () => asks((r: Config) => r.greeting)),
 *   map(({ greeting, name }) => `${greeting}, ${name}!`),
 * );
 *
 * program({ greeting: 'hello' }); // Ok('hello, world!')
 * ```
 *
 * @module
 */

import { ok, okAsync } from 'neverthrow';

import type { ExtendedScope, ResultAsyncR, ResultR } from './types.js';

/**
 * Seeds a do-chain with an empty scope record `{}` over a `ResultR`.
 *
 * @remarks
 * Pass an explicit type argument when you want to fix the chain's
 * requirements up front; otherwise leave it as `unknown` and let downstream
 * {@link bindR} calls accumulate requirements via intersection.
 *
 * @typeParam R - The chain's requirements (defaults to `unknown`).
 *
 * @example
 * ```ts
 * import { doR } from '@konker.dev/neverthrow-r/do';
 *
 * const start = doR();
 * start(undefined); // Ok({})
 * ```
 *
 * @see {@link doAsyncR}
 * @see {@link bindR}
 */
export const doR =
  <R = unknown>(): ResultR<R, Record<never, never>, never> =>
  () =>
    ok({});

/**
 * Async sibling of {@link doR}: seeds a do-chain with an empty scope over a
 * `ResultAsyncR`.
 *
 * @example
 * ```ts
 * import { doAsyncR } from '@konker.dev/neverthrow-r/do';
 *
 * const start = doAsyncR();
 * start(undefined); // ResultAsync resolving to Ok({})
 * ```
 *
 * @see {@link doR}
 */
export const doAsyncR =
  <R = unknown>(): ResultAsyncR<R, Record<never, never>, never> =>
  () =>
    okAsync({});

/**
 * Adds a named field to a do-chain's scope.
 *
 * @remarks
 * `bindR('name', f)` runs `f(scope)` and, on success, attaches its value at
 * key `name` in the scope record. The step's requirements `R2` are
 * intersected (`R1 & R2`) and its error type `E2` is unioned (`E1 | E2`).
 *
 * The callback receives the *current* scope, so later binds can depend on
 * earlier ones — a key ergonomic win over a flat sequence of {@link andThen}.
 *
 * @typeParam N - The string-literal name of the field being added.
 * @typeParam S - The current scope record.
 * @typeParam R2 - The step's requirements.
 * @typeParam A - The value being bound.
 * @typeParam E2 - The step's error type.
 *
 * @param name - The field name to bind under.
 * @param f - Function from current scope to the next step's `ResultR`.
 *
 * @example
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { bindR, doR } from '@konker.dev/neverthrow-r/do';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(
 *   doR(),
 *   bindR('a', () => okR<number>(2)),
 *   bindR('b', ({ a }) => okR<number>(a * 10)),
 * );
 *
 * program(undefined); // Ok({ a: 2, b: 20 })
 * ```
 *
 * @see {@link bindAsyncR}
 * @see {@link ExtendedScope}
 */
export const bindR =
  <N extends string, S extends object, R2, A, E2>(name: N, f: (s: S) => ResultR<R2, A, E2>) =>
  <R1, E1>(rr: ResultR<R1, S, E1>): ResultR<R1 & R2, ExtendedScope<S, N, A>, E1 | E2> =>
  (r) =>
    rr(r).andThen((s) => f(s)(r).map((a) => ({ ...s, [name]: a }) as ExtendedScope<S, N, A>));

/**
 * Async sibling of {@link bindR}: adds a named field to an async do-chain's
 * scope.
 *
 * @example
 * ```ts
 * import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { bindAsyncR, doAsyncR } from '@konker.dev/neverthrow-r/do';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(
 *   doAsyncR(),
 *   bindAsyncR('a', () => okAsyncR<number>(2)),
 *   bindAsyncR('b', ({ a }) => okAsyncR<number>(a * 10)),
 * );
 *
 * program(undefined); // ResultAsync resolving to Ok({ a: 2, b: 20 })
 * ```
 *
 * @see {@link bindR}
 */
export const bindAsyncR =
  <N extends string, S extends object, R2, A, E2>(name: N, f: (s: S) => ResultAsyncR<R2, A, E2>) =>
  <R1, E1>(rr: ResultAsyncR<R1, S, E1>): ResultAsyncR<R1 & R2, ExtendedScope<S, N, A>, E1 | E2> =>
  (r) =>
    rr(r).andThen((s) => f(s)(r).map((a) => ({ ...s, [name]: a }) as ExtendedScope<S, N, A>));
