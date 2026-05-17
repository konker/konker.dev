import { ok, okAsync } from 'neverthrow';

import type { ExtendedScope, ResultAsyncR, ResultR } from './types.js';

export const doR =
  <R = unknown>(): ResultR<R, Record<never, never>, never> =>
  () =>
    ok({});

export const doAsyncR =
  <R = unknown>(): ResultAsyncR<R, Record<never, never>, never> =>
  () =>
    okAsync({});

export const bindR =
  <N extends string, S extends object, R2, A, E2>(name: N, f: (s: S) => ResultR<R2, A, E2>) =>
  <R1, E1>(rr: ResultR<R1, S, E1>): ResultR<R1 & R2, ExtendedScope<S, N, A>, E1 | E2> =>
  (r) =>
    rr(r).andThen((s) => f(s)(r).map((a) => ({ ...s, [name]: a }) as ExtendedScope<S, N, A>));

export const bindAsyncR =
  <N extends string, S extends object, R2, A, E2>(name: N, f: (s: S) => ResultAsyncR<R2, A, E2>) =>
  <R1, E1>(rr: ResultAsyncR<R1, S, E1>): ResultAsyncR<R1 & R2, ExtendedScope<S, N, A>, E1 | E2> =>
  (r) =>
    rr(r).andThen((s) => f(s)(r).map((a) => ({ ...s, [name]: a }) as ExtendedScope<S, N, A>));
