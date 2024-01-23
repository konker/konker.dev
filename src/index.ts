export * as Effect from '@effect/io/Effect';
export * as Context from '@effect/data/Context';
export * as Layer from '@effect/io/Layer';
export * as Cause from '@effect/io/Cause';
export * as Console from '@effect/io/Console';
export { assert } from '@effect/io/Console';
export * as Deferred from '@effect/io/Deferred';
export * as Either from '@effect/data/Either';
export * as Option from '@effect/data/Option';
export * as Brand from '@effect/data/Brand';
export * as Schema from '@effect/schema/Schema';
export * as TreeFormatter from '@effect/schema/TreeFormatter';
export { flow, identity, pipe } from '@effect/data/Function';
export * as Boolean from '@effect/data/Boolean';
export * as Number from '@effect/data/Number';
export * as ReadonlyArray from '@effect/data/ReadonlyArray';
export * as String from '@effect/data/String';
export * as Equivalence from '@effect/data/Equivalence';
export * as Order from '@effect/data/Order';
export * as Config from '@effect/io/Config';
export * as ConfigError from '@effect/io/ConfigError';
export * as Logger from '@effect/io/Logger';
export * as LogLevel from '@effect/io/LogLevel';
export * as ParseResult from '@effect/schema/ParseResult';

import type { LazyArg } from '@effect/data/Function';
export { LazyArg } from '@effect/data/Function';
export { Predicate } from '@effect/data/Predicate';

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
