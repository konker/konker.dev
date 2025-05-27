import { Effect, pipe } from 'effect';

import type { NonNegativeRational } from './NonNegativeRational.js';
import { mul, mulNonNegativeNumber, reciprocal } from './NonNegativeRational.js';
import type { NonNegativeInteger } from './number.js';

/**
 * Converts a number to a scaled rational value
 *
 * @param n - The number to convert
 * @param scale - The scale factor to apply
 * @returns A Result containing either the scaled rational value or an error
 */
export function toScaledRationalValue(
  n: number,
  scale: NonNegativeRational
): Effect.Effect<NonNegativeRational, Error> {
  return mulNonNegativeNumber(scale, n);
}

/**
 * Converts a rational value to a string with specified decimal places
 *
 * @param rationalValue - The rational value to convert
 * @param decimals - The number of decimal places to include
 * @returns A string representation of the rational value
 */
export function toValueString(rationalValue: NonNegativeRational, decimals: NonNegativeInteger): string {
  const value = rationalValue.n / rationalValue.d;
  return value.toFixed(decimals);
}

/**
 * Converts a scaled rational value to an unscaled string representation
 *
 * @param value - The scaled rational value
 * @param scale - The scale factor to remove
 * @param decimals - The number of decimal places to include
 * @returns A Result containing either the unscaled string value or an error
 */
export function toUnScaledValueString(
  value: NonNegativeRational,
  scale: NonNegativeRational,
  decimals: NonNegativeInteger
): Effect.Effect<string, Error> {
  return pipe(
    reciprocal(scale),
    Effect.flatMap((reciprocalScale) => mul(value, reciprocalScale)),
    Effect.map((unScaledValue) => unScaledValue.n / unScaledValue.d),
    Effect.map((unitValue) => unitValue.toFixed(decimals))
  );
}
