import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import { NonNegativeRational } from '../lib/NonNegativeRational.js';
import type { Nat, NonNegativeInteger } from '../lib/number.js';
import * as unit from './div.js';
import * as Money from './index.js';

describe('Money', () => {
  describe('div', () => {
    it('should div a money value as expected with easy values', () => {
      const a = Effect.runSync(Money.fromNumber(222, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.div(a, 2));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(222 as NonNegativeInteger, 200 as Nat));
    });

    it('should div a money value as expected with 1', () => {
      const a = Effect.runSync(Money.fromNumber(111, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.div(a, 1));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(111 as NonNegativeInteger, 100 as Nat));
    });

    it('should div a money value as expected with zero values', () => {
      const a = Effect.runSync(Money.fromNumber(0, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.div(a, 1));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(0 as NonNegativeInteger, 100 as Nat));
    });

    it('should div a money value as expected with tricky values', () => {
      /* Pathological case:
            > 401 / 1.336
            300.1497005988024
        */
      const a = Effect.runSync(Money.fromNumber(401, 'EUR', 'cent'));
      const actual = Effect.runSync(unit.div(a, 1.336));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(401000 as NonNegativeInteger, 133600 as Nat));
    });

    it('should div a money value with different units as expected', () => {
      const a = Effect.runSync(Money.fromNumber(2.46, 'EUR', 'euro'));
      const actual = Effect.runSync(unit.div(a, 2));

      expect(actual.rationalValue).toStrictEqual(NonNegativeRational(246 as NonNegativeInteger, 200 as Nat));
    });

    it('should fail to div by 0', () => {
      const a = Effect.runSync(Money.fromNumber(2.46, 'EUR', 'euro'));

      expect(() => Effect.runSync(unit.div(a, 0))).toThrow('Expected a positive number');
    });
  });
});
