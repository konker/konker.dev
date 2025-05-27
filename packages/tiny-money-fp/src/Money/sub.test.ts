import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { NonNegativeRational } from '../lib/NonNegativeRational.js';
import type { Nat, NonNegativeInteger } from '../lib/number.js';
import * as Money from './index.js';
import * as unit from './sub.js';

describe('Money', () => {
  describe('sub', () => {
    it('should sub two money values as expected with easy values', () => {
      const a = Effect.runSync(Money.fromNumber(333, 'EUR', 'cent'));
      const b = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.sub(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(222 as NonNegativeInteger, 100 as Nat));
    });

    it('should sub two money values as expected with zero values', () => {
      const a = Effect.runSync(Money.fromNumber(0, 'EUR', 'cent'));
      const b = Effect.runSync(Money.fromNumber(0, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.sub(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(0 as NonNegativeInteger, 100 as Nat));
    });

    it('should sub two money values as expected with zero values', () => {
      const a = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const b = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.sub(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(0 as NonNegativeInteger, 100 as Nat));
    });

    it('should sub two money values as expected with tricky values', () => {
      /* Pathological case:
          > 0.06 - 0.01
          0.049999999999999996
        */
      const a = Effect.runSync(Money.fromNumber(0.06, 'EUR', 'euro'));
      const b = Effect.runSync(Money.fromNumber(0.01, 'EUR', 'euro'));
      const actual = Effect.runSync(unit.sub(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(5 as NonNegativeInteger, 100 as Nat));
    });

    it('should sub two money values with different units as expected', () => {
      const a = Effect.runSync(Money.fromNumber(2.34, 'EUR', 'euro'));
      const b = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.sub(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(123 as NonNegativeInteger, 100 as Nat));
    });

    it('should sub two money values with different units as expected', () => {
      const a = Effect.runSync(Money.fromNumber(333, 'EUR', 'cent'));
      const b = Effect.runSync(Money.fromNumber(1.11, 'EUR', 'euro'));

      const actual = Effect.runSync(unit.sub(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(222 as NonNegativeInteger, 100 as Nat));
    });

    it('should not allow sub on two money values with different currencies', () => {
      const a = Effect.runSync(Money.fromNumber(222, 'JPY', 'yen'));
      const b = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));

      // This is a type test
      // @ts-expect-error currency mismatch expected
      const actual = unit.sub(a, b);

      expect(() => Effect.runSync(actual)).toThrow('CurrencyMismatch: found JPY,EUR');
    });
  });
});
