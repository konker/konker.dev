import { Effect } from 'effect';

import type { Currency, CurrencyScale, CurrencySymbol } from './index.js';
import { CURRENCIES, CURRENCY_UNIT_MAJOR } from './index.js';

export function getCurrencyBySymbol<S extends CurrencySymbol>(symbol: S | string): Effect.Effect<Currency<S>, Error> {
  if (symbol in CURRENCIES) {
    return Effect.succeed(CURRENCIES[symbol]!);
  }
  return Effect.fail(new Error(`NoSuchCurrency: ${symbol.toString()}`));
}

export function getCurrencyScaleForDefaultCurrencyUnit<S extends CurrencySymbol>(currency: Currency<S>): CurrencyScale {
  return currency.scales[CURRENCY_UNIT_MAJOR];
}

export function getCurrencyScaleByCurrencyUnit<S extends CurrencySymbol>(
  currency: Currency<S>,
  unit: keyof (typeof currency)['scales']
): Effect.Effect<CurrencyScale, Error> {
  const scale = currency.scales[unit];
  if (scale) {
    return Effect.succeed(scale);
  }
  return Effect.fail(new Error(`NoSuchUnit: Currency ${String(currency.symbol)} does not have unit ${unit}`));
}
