import { Effect, pipe, Schema } from 'effect';
import type { ParseError } from 'effect/ParseResult';

import { Nat, NonNegativeInteger, NonNegativeNumber } from './number.js';
import { lcm, NAT_ONE, ONE, ZERO } from './number.js';

/** Constant representing zero as a non-negative rational number */
export const ZERO_RATIONAL = NonNegativeRational(ZERO, NAT_ONE);
/** Constant representing one as a non-negative rational number */
export const ONE_RATIONAL = NonNegativeRational(ONE, NAT_ONE);

/**
 * Type representing a non-negative rational number as a fraction
 */
export type NonNegativeRational = {
  /** The numerator of the fraction */
  readonly n: NonNegativeInteger;

  /** the denominator of the fraction */
  readonly d: Nat;
};

/**
 * Creates a non-negative rational number from a numerator and denominator
 *
 * @param n - The numerator (non-negative integer)
 * @param d - The denominator (natural number)
 * @returns A non-negative rational number
 */
export function NonNegativeRational(n: NonNegativeInteger, d: Nat): NonNegativeRational {
  return { n, d };
}

/**
 * Creates a non-negative rational number from a pair of numbers
 *
 * @param n - The numerator (number or string)
 * @param d - The denominator (number or string)
 * @returns A Result containing either the non-negative rational number or an error
 */
export function fromNumberPair(n: number | string, d: number | string): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    Effect.Do,
    Effect.bind('n', () => Schema.decode(NonNegativeInteger)(n)),
    Effect.bind('d', () => Schema.decode(Nat)(d)),
    Effect.map(({ d, n }) => NonNegativeRational(n, d))
  );
}

export function fromNonNegativeIntegerString(intStr: string): Effect.Effect<NonNegativeRational, ParseError> {
  return pipe(
    intStr,
    Schema.decode(NonNegativeInteger),
    Effect.map((nni) => NonNegativeRational(nni, NAT_ONE))
  );
}

export function fromNonNegativeFloatString(nStr: string): Effect.Effect<NonNegativeRational, Error> {
  const [i, d] = nStr.split('.', 2);
  if (!d) {
    return Effect.fail(new Error('Expected a float string'));
  }

  return pipe(
    Math.pow(10, d.length),
    Schema.decode(Nat),
    Effect.flatMap((exp) =>
      pipe(
        Schema.decode(NonNegativeInteger)(`${i}${d}`),
        Effect.map((nni) => NonNegativeRational(nni, exp))
      )
    )
  );
}

/**
 * Creates a non-negative rational number from a non-negative number
 *
 * @param n - The number to convert (number or string)
 * @returns A Result containing either the non-negative rational number or an error
 */
export function fromNonNegativeNumber(n: number | string): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    n,
    Schema.decode(NonNegativeNumber),
    Effect.map((nni) => String(nni)),
    Effect.flatMap((nStr) =>
      Effect.if(!nStr.includes('.'), {
        onTrue: () => fromNonNegativeIntegerString(nStr),
        onFalse: () => fromNonNegativeFloatString(nStr),
      })
    )
  );
}

/**
 * Gets the lowest common denominator for two rational numbers
 *
 * @param a - First rational number
 * @param b - Second rational number
 * @returns A Result containing either a tuple of [a, b, lcd] or an error
 */
export function getLowestCommonDenominator(
  a: NonNegativeRational,
  b: NonNegativeRational
): Effect.Effect<[NonNegativeRational, NonNegativeRational, Nat], Error> {
  return pipe(
    Effect.Do,
    Effect.bind('lcd', () => lcm(a.d, b.d)),
    Effect.bind('lcdMultiplierRationalA', ({ lcd }) =>
      pipe(
        lcd / a.d,
        Schema.decode(Nat),
        Effect.map((lcdMultiplierA) => NonNegativeRational(lcdMultiplierA, lcdMultiplierA))
      )
    ),
    Effect.bind('lcdMultiplierRationalB', ({ lcd }) =>
      pipe(
        lcd / b.d,
        Schema.decode(Nat),
        Effect.map((lcdMultiplierB) => NonNegativeRational(lcdMultiplierB, lcdMultiplierB))
      )
    ),
    Effect.bind('lcdA', ({ lcdMultiplierRationalA }) => mul(a, lcdMultiplierRationalA)),
    Effect.bind('lcdB', ({ lcdMultiplierRationalB }) => mul(b, lcdMultiplierRationalB)),
    Effect.map(({ lcd, lcdA, lcdB }) => [lcdA, lcdB, lcd])
  );
}

/**
 * Calculates the reciprocal of a non-negative rational number
 *
 * @param x - The rational number to get the reciprocal of
 * @returns A Result containing either the reciprocal or an error
 */
export function reciprocal(x: NonNegativeRational): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    x.n,
    Schema.decode(Nat),
    Effect.map((nat) => NonNegativeRational(x.d, nat))
  );
}

/**
 * Multiplies two non-negative rational numbers
 *
 * @param a - First rational number
 * @param b - Second rational number
 * @returns A Result containing either the product or an error
 */
export function mul(a: NonNegativeRational, b: NonNegativeRational): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    Effect.Do,
    Effect.bind('n', () => Schema.decode(NonNegativeInteger)(a.n * b.n)),
    Effect.bind('d', () => Schema.decode(Nat)(a.d * b.d)),
    Effect.map(({ d, n }) => NonNegativeRational(n, d))
  );
}

/**
 * Multiplies a non-negative rational number by a natural number
 *
 * @param x - The rational number
 * @param n - The natural number
 * @returns A Result containing either the product or an error
 */
export function mulNat(x: NonNegativeRational, n: Nat): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    Schema.decode(NonNegativeInteger)(x.n * n),
    Effect.map((nni) => NonNegativeRational(nni, x.d))
  );
}

/**
 * Multiplies a non-negative rational number by a non-negative number
 *
 * @param x - The rational number
 * @param b - The non-negative number
 * @returns A Result containing either the product or an error
 */
export function mulNonNegativeNumber(x: NonNegativeRational, b: number): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    fromNonNegativeNumber(b),
    Effect.flatMap((nnr) => mul(x, nnr))
  );
}

/**
 * Divides two non-negative rational numbers
 *
 * @param a - The dividend
 * @param b - The divisor
 * @returns A Result containing either the quotient or an error
 */
export function div(a: NonNegativeRational, b: NonNegativeRational): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    reciprocal(b),
    Effect.flatMap((r) => mul(a, r))
  );
}

/**
 * Divides a non-negative rational number by a natural number
 *
 * @param x - The dividend
 * @param n - The divisor
 * @returns A Result containing either the quotient or an error
 */
export function divNat(x: NonNegativeRational, n: Nat): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    x.d * n,
    Schema.decode(Nat),
    Effect.map((nat) => NonNegativeRational(x.n, nat))
  );
}

/**
 * Divides a non-negative rational number by a non-negative number
 *
 * @param x - The dividend
 * @param b - The divisor
 * @returns A Result containing either the quotient or an error
 */
export function divNonNegativeNumber(x: NonNegativeRational, b: number): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    fromNonNegativeNumber(b),
    Effect.flatMap((nnn) => div(x, nnn))
  );
}

/**
 * Adds two non-negative rational numbers
 *
 * @param a - First rational number
 * @param b - Second rational number
 * @returns A Result containing either the sum or an error
 */
export function add(a: NonNegativeRational, b: NonNegativeRational): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    getLowestCommonDenominator(a, b),
    Effect.flatMap(([lcdA, lcdB, lcd]) =>
      pipe(
        lcdA.n + lcdB.n,
        Schema.decode(NonNegativeInteger),
        Effect.map((nni) => NonNegativeRational(nni, lcd))
      )
    )
  );
}

/**
 * Subtracts two non-negative rational numbers
 *
 * @param a - The minuend
 * @param b - The subtrahend
 * @returns A Result containing either the difference or an error
 */
export function sub(a: NonNegativeRational, b: NonNegativeRational): Effect.Effect<NonNegativeRational, Error> {
  return pipe(
    getLowestCommonDenominator(a, b),
    Effect.flatMap(([lcdA, lcdB, lcd]) =>
      pipe(
        lcdA.n - lcdB.n,
        Schema.decode(NonNegativeInteger),
        Effect.map((nni) => NonNegativeRational(nni, lcd))
      )
    )
  );
}
