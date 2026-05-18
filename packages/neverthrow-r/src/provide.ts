/**
 * Provision: supply the accumulated requirements `R` to a `ResultR` /
 * `ResultAsyncR` and exit back into a plain `neverthrow` `Result` /
 * `ResultAsync`.
 *
 * @remarks
 * The rest of the package builds up an `R` channel through intersection;
 * this module is where you discharge it. Two flavours:
 *
 * - {@link provide} — supply the full environment in one call. Returns the
 *   underlying `Result` (or `ResultAsync`).
 * - {@link provideSome} — supply a *subset* of the requirements. Returns a
 *   new `ResultR` over the keys that remain unsatisfied.
 *
 * @example
 * ```ts
 * import { asks } from '@konker.dev/neverthrow-r/constructors';
 * import { provide } from '@konker.dev/neverthrow-r/provide';
 *
 * type Deps = { factor: number };
 *
 * const program = asks((r: Deps) => r.factor * 2);
 *
 * provide(program, { factor: 10 }); // Ok(20)
 * ```
 *
 * @module
 */

import type { Result, ResultAsync } from 'neverthrow';

import type { ResultAsyncR, ResultR, Simplify } from './types.js';

/**
 * Supplies the environment to a `ResultR` (or `ResultAsyncR`) and returns
 * the underlying neverthrow value.
 *
 * @remarks
 * Equivalent to calling `rr(deps)` directly, but named for intent and
 * overloaded so the return type tracks whether the input is sync or async.
 *
 * Typically the final call in a pipeline: composition builds a `ResultR<R, T,
 * E>`; `provide` discharges `R`.
 *
 * @typeParam R - The requirements being supplied.
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 *
 * @param rr - The `ResultR` or `ResultAsyncR` to provide for.
 * @param deps - The environment.
 *
 * @example
 * Sync:
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { provide } from '@konker.dev/neverthrow-r/provide';
 *
 * provide(okR<number>(2), undefined); // Ok(2)
 * ```
 *
 * @example
 * Async:
 * ```ts
 * import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
 * import { provide } from '@konker.dev/neverthrow-r/provide';
 *
 * provide(okAsyncR<number>(2), undefined); // ResultAsync resolving to Ok(2)
 * ```
 *
 * @see {@link provideSome}
 */
export function provide<R, T, E>(rr: ResultR<R, T, E>, deps: R): Result<T, E>;
export function provide<R, T, E>(rr: ResultAsyncR<R, T, E>, deps: R): ResultAsync<T, E>;
export function provide<R, T, E>(
  rr: ResultR<R, T, E> | ResultAsyncR<R, T, E>,
  deps: R
): Result<T, E> | ResultAsync<T, E> {
  return rr(deps);
}

/**
 * Supplies a *subset* of the requirements, returning a new `ResultR` whose
 * `R` is narrowed to the remaining keys.
 *
 * @remarks
 * Useful for satisfying part of an environment at one level of an
 * application (e.g. injecting a config singleton in `main`) while leaving the
 * rest to be supplied later (e.g. a per-request handle).
 *
 * The merge is shallow: `partial` and the runtime `rest` are spread into a
 * single object, with `partial` taking precedence on conflicting keys. There
 * is no deep merge — if a requirement value is a nested object, supply the
 * whole nested object in one call, not in pieces across two `provideSome`s.
 *
 * The return type uses {@link Simplify} to flatten `Omit<R, keyof P>` for a
 * clean inferred display.
 *
 * @typeParam R - The full requirements of `rr`.
 * @typeParam T - The success type.
 * @typeParam E - The error type.
 * @typeParam P - The subset of `R` being supplied.
 *
 * @param rr - The `ResultR` or `ResultAsyncR` to partially provide for.
 * @param partial - The subset of requirements to inject now.
 *
 * @example
 * ```ts
 * import { asks } from '@konker.dev/neverthrow-r/constructors';
 * import { provide, provideSome } from '@konker.dev/neverthrow-r/provide';
 *
 * type Deps = { config: { name: string }; handle: number };
 *
 * const program = asks((r: Deps) => `${r.config.name}#${r.handle}`);
 *
 * // Pre-inject config; defer handle to later.
 * const withConfig = provideSome(program, { config: { name: 'svc' } });
 *
 * provide(withConfig, { handle: 42 }); // Ok('svc#42')
 * ```
 *
 * @see {@link provide}
 */
export function provideSome<R, T, E, P extends Partial<R>>(
  rr: ResultR<R, T, E>,
  partial: P
): ResultR<Simplify<Omit<R, keyof P>>, T, E>;
export function provideSome<R, T, E, P extends Partial<R>>(
  rr: ResultAsyncR<R, T, E>,
  partial: P
): ResultAsyncR<Simplify<Omit<R, keyof P>>, T, E>;
export function provideSome<R, T, E, P extends Partial<R>>(
  rr: ResultR<R, T, E> | ResultAsyncR<R, T, E>,
  partial: P
): (rest: Simplify<Omit<R, keyof P>>) => Result<T, E> | ResultAsync<T, E> {
  return (rest) => rr({ ...partial, ...(rest as object) } as unknown as R);
}
