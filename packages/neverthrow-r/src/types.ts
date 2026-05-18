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
