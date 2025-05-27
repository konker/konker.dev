import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { NonNegativeRational } from '../lib/NonNegativeRational.js';
import type { Nat, NonNegativeInteger } from '../lib/number.js';
import * as unit from './add.js';
import * as Money from './index.js';

describe('Money', () => {
  describe('add', () => {
    it('should add two money values as expected with easy values', () => {
      const a = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const b = Effect.runSync(Money.fromNumber(222, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.add(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(333 as NonNegativeInteger, 100 as Nat));
    });

    it('should add two money values as expected with zero values', () => {
      const a = Effect.runSync(Money.fromNumber(0, 'EUR', 'cent'));
      const b = Effect.runSync(Money.fromNumber(0, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.add(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(0 as NonNegativeInteger, 100 as Nat));
    });

    it('should add two money values as expected with zero values', () => {
      const a = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const b = Effect.runSync(Money.fromNumber(0, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.add(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(111 as NonNegativeInteger, 100 as Nat));
    });

    it('should add two money values as expected with tricky values', () => {
      /* Pathological case:
          > 0.01 + 0.06
          0.06999999999999999
        */
      const a = Effect.runSync(Money.fromNumber(0.01, 'EUR', 'euro'));
      const b = Effect.runSync(Money.fromNumber(0.06, 'EUR', 'euro'));
      const actual = Effect.runSync(unit.add(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(7 as NonNegativeInteger, 100 as Nat));
    });

    it('should add two money values with different units as expected', () => {
      const a = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const b = Effect.runSync(Money.fromNumber(1.23, 'EUR', 'euro'));
      const actual = Effect.runSync(unit.add(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(234 as NonNegativeInteger, 100 as Nat));
    });

    it('should add two money values with different units as expected', () => {
      const a = Effect.runSync(Money.fromNumber(1.11, 'EUR', 'euro'));
      const b = Effect.runSync(Money.fromNumber(222, 'EUR', 'cent'));

      const actual = Effect.runSync(unit.add(a, b));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(333 as NonNegativeInteger, 100 as Nat));
    });

    it('should not allow adding two money values with different currencies', () => {
      const a = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const b = Effect.runSync(Money.fromNumber(222, 'JPY', 'yen'));

      // This is a type test
      // @ts-expect-error currency mismatch expected
      const actual = unit.add(a, b);

      expect(() => Effect.runSync(actual)).toThrow('CurrencyMismatch: found EUR,JPY');
    });
  });
});
