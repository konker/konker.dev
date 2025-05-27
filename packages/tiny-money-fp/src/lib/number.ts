import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

const Numeric = Schema.transform(
  // Source schema: a number or a string
  Schema.Union(Schema.String, Schema.Number),
  // Target schema: number
  Schema.Number,
  {
    strict: true,
    // Convert source schema (number or string) into
    // the input of the target schema (number)
    decode: Number,
    // Reverse transformation always returns a number
    encode: (n) => n,
  }
);

export const NumericInt = Numeric.pipe(Schema.int());

/**
 * An Effect schema for non-negative integers
 */
export const NonNegativeInteger = NumericInt.pipe(Schema.greaterThanOrEqualTo(0)).pipe(
  Schema.brand('NonNegativeInteger')
);
export type NonNegativeInteger = Schema.Schema.Type<typeof NonNegativeInteger>;

/** Constant representing zero as a non-negative integer */
export const ZERO = Schema.decodeSync(NonNegativeInteger)(0);
/** Constant representing one as a non-negative integer */
export const ONE = Schema.decodeSync(NonNegativeInteger)(1);
/** Constant representing two as a non-negative integer */
export const TWO = Schema.decodeSync(NonNegativeInteger)(2);
/** Constant representing three as a non-negative integer */
export const THREE = Schema.decodeSync(NonNegativeInteger)(3);

/**
 * An Effect schema for natural numbers (positive integers)
 */
export const Nat = NumericInt.pipe(Schema.greaterThan(0))
  .pipe(Schema.brand('NonNegativeInteger'))
  .pipe(Schema.brand('Nat'));
export type Nat = Schema.Schema.Type<typeof Nat>;

/** Constant representing one as a natural number */
export const NAT_ONE = Schema.decodeSync(Nat)(1);
/** Constant representing one hundred as a natural number */
export const NAT_ONE_HUNDRED = Schema.decodeSync(Nat)(100);
/** Constant representing one thousand as a natural number */
export const NAT_ONE_THOUSAND = Schema.decodeSync(Nat)(1000);

/**
 * An Effect schema for positive numbers
 */
export const PositiveNumber = Numeric.pipe(Schema.greaterThan(0)).pipe(Schema.brand('PositiveNumber'));
export type PositiveNumber = Schema.Schema.Type<typeof PositiveNumber>;

/**
 * An Effect schema for non-negative numbers
 */
export const NonNegativeNumber = Numeric.pipe(Schema.greaterThanOrEqualTo(0))
  .pipe(Schema.brand('PositiveNumber'))
  .pipe(Schema.brand('NonNegativeNumber'));
export type NonNegativeNumber = Schema.Schema.Type<typeof NonNegativeNumber>;

/**
 * Calculates the greatest common divisor of two numbers
 *
 * @param x - First number
 * @param y - Second number
 * @returns The greatest common divisor as a natural number
 */
export function gcd(x: number, y: number): Effect.Effect<Nat, Error> {
  return y === 0 ? Schema.decode(Nat)(x) : gcd(y, x % y);
}

/**
 * Calculates the least common multiple of two numbers
 *
 * @param x - First number
 * @param y - Second number
 * @returns The least common multiple as a natural number
 */
export function lcm(x: number, y: number): Effect.Effect<Nat, Error> {
  return pipe(
    gcd(x, y),
    Effect.map((gcd) => (x * y) / gcd),
    Effect.flatMap(Schema.decode(Nat))
  );
}
