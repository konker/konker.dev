export * from 'effect';

export * as Schema from '@effect/schema/Schema';
export * as TreeFormatter from '@effect/schema/TreeFormatter';
export * as ParseResult from '@effect/schema/ParseResult';

import type { LazyArg } from 'effect/Function';
export type { LazyArg } from 'effect/Function';

// IIFE
export type II = <R>(fe: LazyArg<R>) => R;
export const ii: II = (fe) => fe();

// Generic toError
export function toError(x: unknown): Error {
  return x instanceof Error ? x : new Error(String(x));
}

export function isDefined<T>(x: T | undefined): x is T {
  return x !== undefined && x !== null;
}

// Array functions
export const ArrayUtils = {
  map:
    <A, B>(f: (a: A, i: number) => B) =>
    (as: ReadonlyArray<A>): ReadonlyArray<B> =>
      as.map(f),

  filter:
    <A>(f: (a: A, i: number) => boolean) =>
    (as: ReadonlyArray<A>): ReadonlyArray<A> =>
      as.filter(f),

  filterUndefined: <A>(as: ReadonlyArray<A | undefined>): ReadonlyArray<A> => as.filter(isDefined),

  foldl:
    <A, B>(f: (acc: B, val: A, i: number) => B, b: B) =>
    (as: ReadonlyArray<A>): B =>
      as.reduce(f, b),

  foldr:
    <A, B>(f: (acc: B, val: A, i: number) => B, b: B) =>
    (as: ReadonlyArray<A>): B =>
      as.reduceRight(f, b),

  join:
    <A>(sep = '') =>
    (as: ReadonlyArray<A>): string =>
      as.join(sep),

  // eslint-disable-next-line fp/no-mutating-methods
  toSorted: <A>(as: ReadonlyArray<A>): ReadonlyArray<A> => [...as].sort(),

  // eslint-disable-next-line fp/no-mutating-methods
  toReversed: <A>(as: ReadonlyArray<A>): ReadonlyArray<A> => [...as].reverse(),
};
