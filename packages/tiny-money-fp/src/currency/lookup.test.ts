import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { CURRENCIES, CURRENCY_UNIT_MAJOR } from './index.js';
import * as unit from './lookup.js';

describe('currency/lookup', () => {
  describe('getCurrencyBySymbol', () => {
    it('should work as expected', () => {
      expect(Effect.runSync(unit.getCurrencyBySymbol('EUR'))).toStrictEqual(CURRENCIES.EUR);

      expect(() => Effect.runSync(unit.getCurrencyBySymbol('BANANA' as never))).toThrow('NoSuchCurrency');
    });
  });

  describe('getCurrencyScaleForDefaultCurrencyUnit', () => {
    it('should work as expected', () => {
      expect(unit.getCurrencyScaleForDefaultCurrencyUnit(CURRENCIES.EUR!)).toStrictEqual(
        CURRENCIES.EUR!.scales[CURRENCY_UNIT_MAJOR]
      );
    });
  });

  describe('getCurrencyScaleByCurrencyUnit', () => {
    it('should work as expected', () => {
      expect(Effect.runSync(unit.getCurrencyScaleByCurrencyUnit(CURRENCIES.EUR!, 'cent'))).toStrictEqual(
        CURRENCIES.EUR!.scales.cent
      );

      expect(() => Effect.runSync(unit.getCurrencyScaleByCurrencyUnit(CURRENCIES.EUR!, 'peanuts'))).toThrow(
        'NoSuchUnit'
      );
    });
  });
});
