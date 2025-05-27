import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { NonNegativeRational } from '../lib/NonNegativeRational.js';
import type { Nat, NonNegativeInteger } from '../lib/number.js';
import * as Money from './index.js';
import * as unit from './mul.js';

describe('Money', () => {
  describe('mul', () => {
    it('should mul a money value as expected with easy values', () => {
      const a = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.mul(a, 2));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(222 as NonNegativeInteger, 100 as Nat));
    });

    it('should mul a money value as expected with 1', () => {
      const a = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.mul(a, 1));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(111 as NonNegativeInteger, 100 as Nat));
    });

    it('should mul a money value as expected with zero values', () => {
      const a = Effect.runSync(Money.fromNumber(0, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.mul(a, 0));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(0 as NonNegativeInteger, 100 as Nat));
    });

    it('should mul a money value as expected with tricky values', () => {
      /* Pathological case:
          > 300 * 1.336
          400.8
        */
      const a = Effect.runSync(Money.fromNumber(300, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.mul(a, 1.336));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(400800 as NonNegativeInteger, 100000 as Nat));
    });

    it('should mul a money value with different units as expected', () => {
      const a = Effect.runSync(Money.fromNumber(1.23, 'EUR', 'euro'));
      const actual = Effect.runSync(unit.mul(a, 2));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(246 as NonNegativeInteger, 100 as Nat));
    });
  });
});
