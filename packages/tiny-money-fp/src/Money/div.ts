import { Effect, pipe } from 'effect';

import type { CurrencySymbol } from '../currency/index.js';
import * as NonNegativeRational from '../lib/NonNegativeRational.js';
import { Money } from './Money.js';

/**
 * Divides a Money instance by a number
 *
 * @template S - The currency symbol type
 * @param x - The Money instance to divide
 * @param n - The number to divide by
 * @returns A Result containing either the quotient or an error
 * @function
 */
export function div<S extends CurrencySymbol>(x: Money<S>, n: number): Effect.Effect<Money<S>, Error> {
  return pipe(
    NonNegativeRational.divNonNegativeNumber(x.rationalValue, n),
    Effect.map((newRationalValue) => new Money(newRationalValue, x.currency))
  );
}
