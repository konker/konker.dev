import { Effect, pipe } from 'effect';

import type { CURRENCIES, CurrencySymbol } from '../currency/index.js';
import { getCurrencyBySymbol, getCurrencyScaleByCurrencyUnit } from '../currency/lookup.js';
import { toScaledRationalValue } from '../lib/helpers.js';
import { Money } from './Money.js';

/**
 * Creates a Money instance from a number or string value
 *
 * @template S - The currency symbol type
 * @param n - The numeric value to convert (can be a number or string)
 * @param currencySymbol - The currency symbol to use
 * @param unit - The unit of the input value (e.g., 'USD', 'cents')
 * @returns A Result containing either the created Money instance or an error
 * @function
 */
export function fromNumber<S extends CurrencySymbol>(
  n: number | string,
  currencySymbol: S | string,
  unit: keyof CURRENCIES[S]['scales'] extends string ? keyof CURRENCIES[S]['scales'] : never
): Effect.Effect<Money<S>, Error> {
  return pipe(
    getCurrencyBySymbol(currencySymbol),
    Effect.flatMap((currency) =>
      pipe(
        getCurrencyScaleByCurrencyUnit(currency, unit),
        Effect.flatMap((scale) => toScaledRationalValue(Number(n), scale.multiplier)),
        Effect.map((rationalValue) => new Money(rationalValue, currency))
      )
    )
  );
}
