/**
 * Type-level vocabulary for the package: the `ResultR` / `ResultAsyncR` shapes
 * that add a *requirements* channel on top of `neverthrow`'s `Result` /
 * `ResultAsync`, plus the helper types (`Scope`, `ExtendedScope`, `Simplify`)
 * used by do-notation and intersection flattening.
 *
 * @remarks
 * Most users only need {@link ResultR} and {@link ResultAsyncR}. The remaining
 * exports are surfaced because the do-notation helpers (`bindR`, `bindAsyncR`)
 * expose them in their return types, so consumers may encounter them in
 * inferred types.
 *
 * Every operator across the package — sync, async, bridges, do — preserves the
 * R/T/E shape and **intersects** the `R` channel across composed steps
 * (`R1 & R2`), so requirements accumulate as a chain is built.
 *
 * @example
 * Lift a value, transform it, accumulate requirements, then provide them:
 *
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { andThen, map } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 * import { provide } from '@konker.dev/neverthrow-r/provide';
 * import type { ResultR } from '@konker.dev/neverthrow-r/types';
 *
 * type WithMultiplier = { multiplier: number };
 *
 * const scaled = (n: number): ResultR<WithMultiplier, number, never> =>
 *   (r) => okR<number>(n * r.multiplier)(undefined);
 *
 * const program = pipe(
 *   okR<number>(2),
 *   map((n) => n + 1),
 *   andThen(scaled),
 * );
 *
 * provide(program, { multiplier: 10 }); // Ok(30)
 * ```
 *
 * @module
 */

import type { Result, ResultAsync } from 'neverthrow';

/**
 * A `Result<T, E>` that requires an environment `R` to produce.
 *
 * @remarks
 * `ResultR<R, T, E>` is structurally `(r: R) => Result<T, E>`. The `R` channel
 * is the third dimension this package adds on top of `neverthrow`: it makes
 * dependencies (database handles, config, clocks, …) explicit in the type
 * rather than implicit in the closure.
 *
 * Use `unknown` for `R` when no environment is required (most often via the
 * default on constructors like {@link okR}).
 *
 * Composition operators in {@link sync} and {@link do} intersect `R` across
 * steps, so `R1 & R2 & R3` falls out of `andThen`-style chains automatically.
 *
 * @typeParam R - The requirements (environment) the value depends on.
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 *
 * @example
 * ```ts
 * import type { ResultR } from '@konker.dev/neverthrow-r/types';
 * import { ok } from 'neverthrow';
 *
 * type Deps = { now: () => Date };
 *
 * const currentYear: ResultR<Deps, number, never> =
 *   (r) => ok(r.now().getFullYear());
 * ```
 *
 * @see {@link ResultAsyncR} for the async sibling.
 * @see {@link provide} for supplying the environment.
 */
export type ResultR<R, T, E> = (r: R) => Result<T, E>;

/**
 * A `ResultAsync<T, E>` that requires an environment `R` to produce.
 *
 * @remarks
 * The async sibling of {@link ResultR}. Structurally `(r: R) => ResultAsync<T, E>`.
 * Combine sync and async values in one pipeline via the {@link bridges} module.
 *
 * @typeParam R - The requirements (environment) the value depends on.
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 *
 * @example
 * ```ts
 * import type { ResultAsyncR } from '@konker.dev/neverthrow-r/types';
 * import { okAsync } from 'neverthrow';
 *
 * type Deps = { fetch: (url: string) => Promise<unknown> };
 *
 * const fetchJson: (url: string) => ResultAsyncR<Deps, unknown, never> =
 *   (url) => (r) => okAsync(undefined).map(() => r.fetch(url));
 * ```
 *
 * @see {@link ResultR} for the sync version.
 */
export type ResultAsyncR<R, T, E> = (r: R) => ResultAsync<T, E>;

/**
 * Flattens an intersection type into a single record so it renders nicely in
 * inferred type displays and tooltips.
 *
 * @remarks
 * Used internally where a chain has accumulated `R1 & R2 & R3 & …` and a
 * cleaner display is desired (e.g. {@link provideSome}'s return type). Has no
 * runtime effect.
 *
 * @typeParam T - The type to flatten.
 *
 * @example
 * ```ts
 * import type { Simplify } from '@konker.dev/neverthrow-r/types';
 *
 * type A = { a: number };
 * type B = { b: string };
 * type Combined = Simplify<A & B>; // { a: number; b: string }
 * ```
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * A record-shaped scope keyed by string field names, used by do-notation to
 * accumulate intermediate values across a chain of `bindR` / `bindAsyncR`
 * steps.
 *
 * @typeParam Keys - The union of string keys currently in the scope.
 *
 * @example
 * ```ts
 * import type { Scope } from '@konker.dev/neverthrow-r/types';
 *
 * type S = Scope<'user' | 'config'>;
 * // { user: unknown; config: unknown }
 * ```
 *
 * @see {@link ExtendedScope} for the type-level "add a field" operation.
 */
export type Scope<Keys extends string> = Record<Keys, unknown>;

/**
 * Adds a typed field `N: A` to an existing scope `S`, preserving the existing
 * fields' types. Distributive over unions in `S`.
 *
 * @remarks
 * This is the type-level operation behind {@link bindR}: it computes the
 * record shape *after* a new field has been bound, with the new field's type
 * `A` slotted in and existing fields untouched.
 *
 * @typeParam S - The existing scope record.
 * @typeParam N - The string-literal name of the field being added.
 * @typeParam A - The type of the newly bound value.
 *
 * @example
 * ```ts
 * import type { ExtendedScope } from '@konker.dev/neverthrow-r/types';
 *
 * type S0 = { user: { id: number } };
 * type S1 = ExtendedScope<S0, 'role', 'admin' | 'guest'>;
 * // { user: { id: number }; role: 'admin' | 'guest' }
 * ```
 *
 * @see {@link bindR}
 */
export type ExtendedScope<S extends object, N extends string, A> = S extends unknown
  ? {
      [K in keyof S | N]: K extends N ? A : K extends keyof S ? S[K] : never;
    }
  : never;
