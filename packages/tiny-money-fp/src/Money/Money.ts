/* eslint-disable fp/no-class,fp/no-this,fp/no-nil */
import { Effect, pipe } from 'effect';

import type { Currency, CurrencySymbol } from '../currency/index.js';
import { getCurrencyScaleByCurrencyUnit, getCurrencyScaleForDefaultCurrencyUnit } from '../currency/lookup.js';
import type { IMoney } from '../index.js';
import { toUnScaledValueString, toValueString } from '../lib/helpers.js';
import type { NonNegativeRational } from '../lib/NonNegativeRational.js';

/**
 * This package provides a way of performing arithmetic on money values without using floating point numbers.
 *
 * It provides a way to safely convert between major and minor currency units for a given monetary value,
 * and provides type-safety to prevent calculations with money values of different currencies.
 *
 * @template S - The currency symbol type
 */
export class Money<S extends CurrencySymbol = CurrencySymbol> implements IMoney<S> {
  /**
   * Creates a new Money instance
   *
   * @param rationalValue - The rational number representing the money value
   * @param currency - The currency information
   */
  constructor(
    readonly rationalValue: NonNegativeRational,
    readonly currency: Currency<S>
  ) {}

  /**
   * Converts the money value to a string representation in the default currency unit
   *
   * @returns A string representation of the money value in the default unit
   */
  asDefaultUnitValueString(): string {
    const defaultUnitScale = getCurrencyScaleForDefaultCurrencyUnit(this.currency);

    return toValueString(this.rationalValue, defaultUnitScale.decimals);
  }

  /**
   * Converts the money value to a string representation in the specified currency unit
   *
   * @param unit - The currency unit to convert to (e.g., 'USD', 'cents')
   * @returns A Result containing either the string representation or an error
   */
  asUnitValueString(unit: string): Effect.Effect<string, Error> {
    return pipe(
      getCurrencyScaleByCurrencyUnit(this.currency, unit),
      Effect.flatMap((scale) => toUnScaledValueString(this.rationalValue, scale.multiplier, scale.decimals))
    );
  }

  /**
   * Converts the money value to a number in the specified currency unit
   *
   * @param unit - The currency unit to convert to (e.g., 'USD', 'cents')
   * @returns A Result containing either the numeric value or an error
   */
  asUnitValue(unit: string): Effect.Effect<number, Error> {
    return pipe(
      this.asUnitValueString(unit),
      Effect.map((unitValueString) => parseFloat(unitValueString))
    );
  }

  /**
   * Returns a string representation of the Money instance
   *
   * @returns A string in the format "Money: (numerator / denominator) | value symbol"
   */
  toString(): string {
    return `${this.constructor.name}: (${this.rationalValue.n} / ${this.rationalValue.d}) | ${this.asDefaultUnitValueString()} ${this.currency.symbol}`;
  }
}
