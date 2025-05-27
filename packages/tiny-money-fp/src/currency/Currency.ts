import type { NonNegativeRational } from '../lib/NonNegativeRational.js';
import type { NonNegativeInteger } from '../lib/number.js';

export const CURRENCY_UNIT_MAJOR = 'major';
export const CURRENCY_UNIT_MINOR = 'minor';

export type CurrencyScale = {
  multiplier: NonNegativeRational;
  decimals: NonNegativeInteger;
};

export type Currency<S extends string> = {
  readonly symbol: S;
  readonly scales: Record<string, CurrencyScale> & {
    [CURRENCY_UNIT_MAJOR]: CurrencyScale;
    [CURRENCY_UNIT_MINOR]: CurrencyScale;
  };
};

/* eslint-disable @typescript-eslint/consistent-type-definitions */
export interface CURRENCIES {}

export type CurrencySymbol = keyof CURRENCIES;

export const CURRENCIES: Record<string, Currency<any>> = {};
