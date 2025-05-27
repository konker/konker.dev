/* eslint-disable fp/no-rest-parameters */
import { Effect, pipe } from 'effect';
import type { NonEmptyArray } from 'effect/Array';

import type { CurrencySymbol } from '../currency/index.js';
import * as NonNegativeRational from '../lib/NonNegativeRational.js';
import { add } from './add.js';
import type { NonEmptyArrayOfMoney } from './index.js';
import { Money } from './Money.js';

/**
 * Sums an array of Money instances.
 *
 * All instances must have the same currency type.
 *
 * @template S - The currency symbol type
 * @param as - Array of Money instances to sum
 * @returns A Result containing either the sum or an error
 * @function
 */
export function sum<S extends CurrencySymbol>(...as: NonEmptyArrayOfMoney<S>): Effect.Effect<Money<S>, Error> {
  const operandCurrencies = new Set(as.map((x) => x.currency.symbol));
  if (operandCurrencies.size > 1) {
    return Effect.fail(new Error(`CurrencyMismatch: found ${[...operandCurrencies].join(',')}`));
  }

  const _as = [...as] as NonEmptyArray<Money<S>>;
  const zeroMoney = new Money(NonNegativeRational.ZERO_RATIONAL, as[0].currency) as Money<S>;

  return _as.reduce(
    (acc: Effect.Effect<Money<S>, Error>, val: Money<S>) =>
      pipe(
        acc,
        Effect.flatMap((x) => add(x, val))
      ),
    Effect.succeed(zeroMoney)
  );
}
