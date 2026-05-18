/**
 * Provision: supply the environment to a `ResultR` / `ResultAsyncR` and
 * obtain the underlying neverthrow value. `provide(rr, deps)` is the named
 * alias for `rr(deps)` with explicit type narrowing. `provideSome(rr, p)`
 * whole-replaces a subset of requirement keys and returns a `ResultR` over
 * the remaining ones (no deep merge).
 *
 * @module
 */

import type { Result, ResultAsync } from 'neverthrow';

import type { ResultAsyncR, ResultR, Simplify } from './types.js';

export function provide<R, T, E>(rr: ResultR<R, T, E>, deps: R): Result<T, E>;
export function provide<R, T, E>(rr: ResultAsyncR<R, T, E>, deps: R): ResultAsync<T, E>;
export function provide<R, T, E>(
  rr: ResultR<R, T, E> | ResultAsyncR<R, T, E>,
  deps: R
): Result<T, E> | ResultAsync<T, E> {
  return rr(deps);
}

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
