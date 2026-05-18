/**
 * Core type aliases for the Reader-function layer: `ResultR<R, T, E>` is
 * `(r: R) => Result<T, E>` and `ResultAsyncR<R, T, E>` is its async sibling.
 * `R` defaults to `unknown` (no specific requirements). Also exposes the
 * `Scope` / `ExtendedScope` helpers used by do-notation and the `Simplify`
 * intersection-flattener.
 *
 * @module
 */

import type { Result, ResultAsync } from 'neverthrow';

export type ResultR<R, T, E> = (r: R) => Result<T, E>;
export type ResultAsyncR<R, T, E> = (r: R) => ResultAsync<T, E>;

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type Scope<Keys extends string> = Record<Keys, unknown>;

export type ExtendedScope<S extends object, N extends string, A> = S extends unknown
  ? {
      [K in keyof S | N]: K extends N ? A : K extends keyof S ? S[K] : never;
    }
  : never;
