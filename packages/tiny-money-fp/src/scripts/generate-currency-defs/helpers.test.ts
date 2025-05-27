import type currencyCodes from 'currency-codes';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as unit from './helpers.js';

describe('helpers', () => {
  const TEST_CURRENCY_DEF_1: currencyCodes.CurrencyCodeRecord = {
    code: 'EUR',
    number: '978',
    digits: 2,
    currency: 'Euro',
    countries: ['Åland Islands', 'European Union', 'Finland'],
  };

  describe('log', () => {
    let spy: MockInstance;
    beforeEach(() => {
      spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should work as expected', () => {
      unit.log('FOO');
      expect(spy).toHaveBeenCalledWith('[generate-currency-defs]', 'FOO');
    });

    it('should work as expected', () => {
      unit.log('FOO', 123, false);
      expect(spy).toHaveBeenCalledWith('[generate-currency-defs]', 'FOO', 123, false);
    });

    it('should work as expected', () => {
      unit.log();
      expect(spy).toHaveBeenCalledWith('[generate-currency-defs]');
    });
  });

  describe('resolveDecimalsFromN', () => {
    it('should work as expected', () => {
      expect(unit.resolveDecimalsFromN(0)).toEqual('N.ZERO');
      expect(unit.resolveDecimalsFromN(1)).toEqual('N.ONE');
      expect(unit.resolveDecimalsFromN(2)).toEqual('N.TWO');
      expect(unit.resolveDecimalsFromN(3)).toEqual('N.THREE');
      expect(() => unit.resolveDecimalsFromN(4)).toThrow('Could not resolve decimals');
    });
  });

  describe('resolveMultiplierFromN', () => {
    it('should work as expected', () => {
      expect(unit.resolveMultiplierFromN(2)).toBeDefined();
      expect(unit.resolveMultiplierFromN(3)).toBeDefined();
      expect(() => unit.resolveMultiplierFromN(4)).toThrow('Could not resolve multiplier');
    });
  });

  describe('resolveScaleFromDigitsMajor', () => {
    it('should work as expected', () => {
      expect(unit.resolveScaleFromDigitsMajor(TEST_CURRENCY_DEF_1, 'euro')).toStrictEqual({
        decimals: 'N.TWO',
        multiplier: 'NonNegativeRational.ONE_RATIONAL',
        unit: 'euro',
      });
    });
  });

  describe('resolveScaleFromDigitsMinor', () => {
    it('should work as expected', () => {
      expect(unit.resolveScaleFromDigitsMinor(TEST_CURRENCY_DEF_1, 'cent')).toStrictEqual({
        decimals: 'N.ZERO',
        multiplier: 'NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED)',
        unit: 'cent',
      });
    });
  });

  describe('enquoteUnit', () => {
    it('should work as expected', () => {
      expect(unit.enquoteUnit('EUR')).toEqual('EUR');
      expect(unit.enquoteUnit('convertible mark')).toEqual("'convertible mark'");
      expect(unit.enquoteUnit("pa'anga")).toEqual('"pa\'anga"');
    });
  });
});
