import { Effect, pipe } from 'effect';

import type { CurrencySymbol } from '../currency/index.js';
import * as NonNegativeRational from '../lib/NonNegativeRational.js';
import { Money } from './Money.js';

/**
 * Adds two Money instances together.
 *
 * The second operand must have the same currency type as the first.
 *
 * @template S - The currency symbol type of the first operand
 * @template S2 - The currency symbol type of the second operand (must be same or compatible with S)
 * @param a - The first Money instance
 * @param b - The second Money instance (must have same or compatible currency)
 * @returns A Result containing either the sum or an error
 * @function
 */
export function add<S extends CurrencySymbol, S2 extends S>(a: Money<S>, b: Money<S2>): Effect.Effect<Money<S>, Error> {
  if (a.currency.symbol !== b.currency.symbol) {
    return Effect.fail(new Error(`CurrencyMismatch: found ${a.currency.symbol},${b.currency.symbol}`));
  }

  return pipe(
    NonNegativeRational.add(a.rationalValue, b.rationalValue),
    Effect.map((newRationalValue) => new Money(newRationalValue, a.currency))
  );
}
