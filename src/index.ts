export * from 'effect';

export * as Schema from '@effect/schema/Schema';
export * as TreeFormatter from '@effect/schema/TreeFormatter';
export * as ParseResult from '@effect/schema/ParseResult';

import type { LazyArg } from '@effect/data/Function';
export { LazyArg } from '@effect/data/Function';

// IIFE
export type II = <R>(fe: LazyArg<R>) => R;
export const ii: II = (fe) => fe();

// Generic toError
export function toError(x: unknown): Error {
  return x instanceof Error ? x : new Error(String(x));
}

// Array functions
export const Array = {
  map:
    <A, B>(f: (a: A) => B) =>
    (as: Array<A>): Array<B> =>
      as.map(f),

  foldl:
    <A, B>(f: (acc: B, val: A) => B, b: B) =>
    (as: Array<A>): B =>
      as.reduce(f, b),

  foldr:
    <A, B>(f: (acc: B, val: A) => B, b: B) =>
    (as: Array<A>): B =>
      as.reduceRight(f, b),

  join:
    <A>(sep = '') =>
    (as: Array<A>): string =>
      as.join(sep),

  // eslint-disable-next-line fp/no-mutating-methods
  toSorted: <A>(as: Array<A>): Array<A> => [...as].sort(),

  // eslint-disable-next-line fp/no-mutating-methods
  toReversed: <A>(as: Array<A>): Array<A> => [...as].reverse(),
};
