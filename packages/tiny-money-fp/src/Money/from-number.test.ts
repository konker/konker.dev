import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { CURRENCIES } from '../currency/index.js';
import { NonNegativeRational } from '../lib/NonNegativeRational.js';
import type { Nat, NonNegativeInteger } from '../lib/number.js';
import * as unit from './from-number.js';

describe('Money', () => {
  describe('fromNumber', () => {
    it('should create a Money instance as expected', () => {
      expect(Effect.runSync(unit.fromNumber(123, 'EUR', 'cent'))).toMatchObject({
        rationalValue: NonNegativeRational(123 as NonNegativeInteger, 100 as Nat),
        currency: CURRENCIES.EUR,
      });

      expect(Effect.runSync(unit.fromNumber(0, 'EUR', 'cent'))).toMatchObject({
        rationalValue: NonNegativeRational(0 as NonNegativeInteger, 100 as Nat),
        currency: CURRENCIES.EUR,
      });

      expect(Effect.runSync(unit.fromNumber(1.23, 'EUR', 'euro'))).toMatchObject({
        rationalValue: NonNegativeRational(123 as NonNegativeInteger, 100 as Nat),
        currency: CURRENCIES.EUR,
      });

      expect(Effect.runSync(unit.fromNumber(0, 'EUR', 'minor'))).toMatchObject({
        rationalValue: NonNegativeRational(0 as NonNegativeInteger, 100 as Nat),
        currency: CURRENCIES.EUR,
      });

      expect(Effect.runSync(unit.fromNumber(1.23, 'EUR', 'major'))).toMatchObject({
        rationalValue: NonNegativeRational(123 as NonNegativeInteger, 100 as Nat),
        currency: CURRENCIES.EUR,
      });

      expect(Effect.runSync(unit.fromNumber(1.11, 'EUR', 'euro'))).toMatchObject({
        rationalValue: NonNegativeRational(111 as NonNegativeInteger, 100 as Nat),
        currency: CURRENCIES.EUR,
      });

      expect(Effect.runSync(unit.fromNumber(123, 'EUR', 'euro'))).toMatchObject({
        rationalValue: NonNegativeRational(123 as NonNegativeInteger, 1 as Nat),
        currency: CURRENCIES.EUR,
      });

      expect(Effect.runSync(unit.fromNumber(123, 'JPY', 'yen'))).toMatchObject({
        rationalValue: NonNegativeRational(123 as NonNegativeInteger, 1 as Nat),
        currency: CURRENCIES.JPY,
      });

      expect(Effect.runSync(unit.fromNumber(123, 'JPY', 'major'))).toMatchObject({
        rationalValue: NonNegativeRational(123 as NonNegativeInteger, 1 as Nat),
        currency: CURRENCIES.JPY,
      });

      expect(Effect.runSync(unit.fromNumber(123, 'JPY', 'minor'))).toMatchObject({
        rationalValue: NonNegativeRational(123 as NonNegativeInteger, 1 as Nat),
        currency: CURRENCIES.JPY,
      });
    });

    it('should fail to create a Money instance as expected', () => {
      expect(() => Effect.runSync(unit.fromNumber(123, 'SHELLS' as never, 'cent' as never))).toThrow('NoSuchCurrency');

      expect(() => Effect.runSync(unit.fromNumber(123, 'EUR', 'peanuts' as never))).toThrow('NoSuchUnit');
    });
  });
});
