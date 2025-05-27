import { Effect, pipe } from 'effect';

import type { CurrencySymbol } from '../currency/index.js';
import * as NonNegativeRational from '../lib/NonNegativeRational.js';
import { Money } from './Money.js';

/**
 * Multiplies a Money instance by a number
 *
 * @template S - The currency symbol type
 * @param x - The Money instance to multiply
 * @param n - The number to multiply by
 * @returns A Result containing either the product or an error
 * @function
 */
export function mul<S extends CurrencySymbol>(x: Money<S>, n: number): Effect.Effect<Money<S>, Error> {
  return pipe(
    NonNegativeRational.mulNonNegativeNumber(x.rationalValue, n),
    Effect.map((newRationalValue) => new Money(newRationalValue, x.currency))
  );
}
