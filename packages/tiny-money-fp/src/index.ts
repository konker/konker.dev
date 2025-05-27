import type { Currency, CurrencySymbol } from './currency/index.js';
import type { NonNegativeRational } from './lib/NonNegativeRational.js';

export * as Money from './Money/index.js';
export * as NonNegativeRational from './lib/NonNegativeRational.js';

export * from './lib/number.js';
export * from './currency/index.js';

export type IMoney<S extends CurrencySymbol> = {
  /** The rational value representing the amount */
  readonly rationalValue: NonNegativeRational;

  /** The currency information */
  readonly currency: Currency<S>;
};
