import type { Result, ResultAsync } from 'neverthrow';
import { err, errAsync, ok, okAsync } from 'neverthrow';

import type { ResultAsyncR, ResultR } from './types.js';

export const okR =
  <T, E = never>(value: T): ResultR<unknown, T, E> =>
  () =>
    ok(value);

export const errR =
  <E, T = never>(error: E): ResultR<unknown, T, E> =>
  () =>
    err(error);

export const okAsyncR =
  <T, E = never>(value: T): ResultAsyncR<unknown, T, E> =>
  () =>
    okAsync(value);

export const errAsyncR =
  <E, T = never>(error: E): ResultAsyncR<unknown, T, E> =>
  () =>
    errAsync(error);

export const fromResult =
  <T, E>(r: Result<T, E>): ResultR<unknown, T, E> =>
  () =>
    r;

export const fromResultAsync =
  <T, E>(ra: ResultAsync<T, E>): ResultAsyncR<unknown, T, E> =>
  () =>
    ra;

export const asks =
  <R, A>(f: (r: R) => A): ResultR<R, A, never> =>
  (r) =>
    ok(f(r));

export const ask = <R>(): ResultR<R, R, never> => asks((r: R) => r);
