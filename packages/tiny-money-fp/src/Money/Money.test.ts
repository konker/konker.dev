import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { CURRENCIES } from '../currency/index.js';
import { NonNegativeRational } from '../lib/NonNegativeRational.js';
import type { Nat, NonNegativeInteger } from '../lib/number.js';
import { fromNumber } from './from-number.js';
import { Money } from './Money.js';

describe('Money', () => {
  describe('constructor', () => {
    it('should create a Money instance with valid parameters', () => {
      const rationalValue = NonNegativeRational(123 as NonNegativeInteger, 100 as Nat);
      const money = new Money(rationalValue, CURRENCIES.EUR!);

      expect(money.rationalValue).toStrictEqual(rationalValue);
      expect(money.currency).toStrictEqual(CURRENCIES.EUR);
    });

    it('should create a Money instance with zero value', () => {
      const rationalValue = NonNegativeRational(0 as NonNegativeInteger, 100 as Nat);
      const money = new Money(rationalValue, CURRENCIES.EUR!);

      expect(money.rationalValue).toStrictEqual(rationalValue);
      expect(money.currency).toStrictEqual(CURRENCIES.EUR);
    });

    it('should create a Money instance with JPY currency', () => {
      const rationalValue = NonNegativeRational(123 as NonNegativeInteger, 1 as Nat);
      const money = new Money(rationalValue, CURRENCIES.JPY!);

      expect(money.rationalValue).toStrictEqual(rationalValue);
      expect(money.currency).toStrictEqual(CURRENCIES.JPY);
    });
  });

  describe('asDefaultUnitValueString', () => {
    it('should work as expected with 123 cents', () => {
      const x = Effect.runSync(fromNumber(123, 'EUR', 'cent'));
      expect(x.asDefaultUnitValueString()).toEqual('1.23');
    });

    it('should work as expected with 123 cents as a decimal', () => {
      const x = Effect.runSync(fromNumber(1.23, 'EUR', 'euro'));
      expect(x.asDefaultUnitValueString()).toEqual('1.23');
    });
  });

  describe('asUnitValueString', () => {
    it('should work as expected with 123 cents', () => {
      const x = Effect.runSync(fromNumber(123, 'EUR', 'cent'));
      expect(Effect.runSync(x.asUnitValueString('euro'))).toEqual('1.23');
      expect(Effect.runSync(x.asUnitValueString('cent'))).toEqual('123');
    });

    it('should work as expected with 123 cents as a decimal', () => {
      const x = Effect.runSync(fromNumber(1.23, 'EUR', 'euro'));
      expect(Effect.runSync(x.asUnitValueString('euro'))).toEqual('1.23');
      expect(Effect.runSync(x.asUnitValueString('cent'))).toEqual('123');
    });

    it('should fail as expected with an invalid unit', () => {
      const x = Effect.runSync(fromNumber(1.23, 'EUR', 'euro'));
      expect(() => Effect.runSync(x.asUnitValueString('peanuts'))).toThrow('NoSuchUnit');
    });
  });

  describe('asUnitValue', () => {
    it('should work as expected with 123 cents', () => {
      const x = Effect.runSync(fromNumber(123, 'EUR', 'cent'));
      expect(Effect.runSync(x.asUnitValue('euro'))).toEqual(1.23);
      expect(Effect.runSync(x.asUnitValue('cent'))).toEqual(123);
    });

    it('should work as expected with 123 cents as a decimal', () => {
      const x = Effect.runSync(fromNumber(1.23, 'EUR', 'euro'));
      expect(Effect.runSync(x.asUnitValue('euro'))).toEqual(1.23);
      expect(Effect.runSync(x.asUnitValue('cent'))).toEqual(123);
    });
  });

  describe('toString', () => {
    it('should work as expected', () => {
      const x = Effect.runSync(fromNumber(123, 'EUR', 'cent'));

      expect(x.toString()).toEqual('Money: (123 / 100) | 1.23 EUR');
    });
  });
});
