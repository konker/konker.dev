import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './helpers.js';
import * as NonNegativeRational from './NonNegativeRational.js';
import type { Nat, NonNegativeInteger } from './number.js';

describe('helpers', () => {
  describe('toScaledRationalValue', () => {
    it('should work as expected', () => {
      expect(
        Effect.runSync(
          unit.toScaledRationalValue(1.23, NonNegativeRational.NonNegativeRational(100 as NonNegativeInteger, 1 as Nat))
        )
      ).toStrictEqual(NonNegativeRational.NonNegativeRational(12300 as NonNegativeInteger, 100 as Nat));
      expect(
        Effect.runSync(
          unit.toScaledRationalValue(1.11, NonNegativeRational.NonNegativeRational(100 as NonNegativeInteger, 1 as Nat))
        )
      ).toStrictEqual(NonNegativeRational.NonNegativeRational(11100 as NonNegativeInteger, 100 as Nat));
      expect(
        Effect.runSync(
          unit.toScaledRationalValue(123, NonNegativeRational.NonNegativeRational(100 as NonNegativeInteger, 1 as Nat))
        )
      ).toStrictEqual(NonNegativeRational.NonNegativeRational(12300 as NonNegativeInteger, 1 as Nat));
    });

    it('should work as expected in the invalid case where the scale gives a float', () => {
      expect(
        Effect.runSync(
          unit.toScaledRationalValue(123, NonNegativeRational.NonNegativeRational(1 as NonNegativeInteger, 100 as Nat))
        )
      ).toStrictEqual(NonNegativeRational.NonNegativeRational(123 as NonNegativeInteger, 100 as Nat));
    });
  });

  describe('toValueString', () => {
    it('should work as expected', () => {
      expect(
        unit.toValueString(Effect.runSync(NonNegativeRational.fromNonNegativeNumber(1.23)), 2 as NonNegativeInteger)
      ).toEqual('1.23');

      expect(
        unit.toValueString(Effect.runSync(NonNegativeRational.fromNonNegativeNumber(123)), 2 as NonNegativeInteger)
      ).toEqual('123.00');

      expect(
        unit.toValueString(Effect.runSync(NonNegativeRational.fromNonNegativeNumber(0)), 2 as NonNegativeInteger)
      ).toEqual('0.00');
    });
  });

  describe('toUnScaledValueString', () => {
    const TEST_SCALE = NonNegativeRational.NonNegativeRational(100 as NonNegativeInteger, 1 as Nat);

    it('should work as expected', () => {
      const v1 = Effect.runSync(NonNegativeRational.fromNonNegativeNumber(123));
      expect(Effect.runSync(unit.toUnScaledValueString(v1, TEST_SCALE, 2 as NonNegativeInteger))).toEqual('1.23');

      const v2 = Effect.runSync(NonNegativeRational.fromNonNegativeNumber(12300));
      expect(Effect.runSync(unit.toUnScaledValueString(v2, TEST_SCALE, 2 as NonNegativeInteger))).toEqual('123.00');

      const v3 = Effect.runSync(NonNegativeRational.fromNonNegativeNumber(123));
      expect(() =>
        Effect.runSync(
          unit.toUnScaledValueString(
            v3,
            NonNegativeRational.NonNegativeRational(0 as NonNegativeInteger, 1 as Nat),
            2 as NonNegativeInteger
          )
        )
      ).toThrow('Expected a positive number');
    });

    it('should work as expected in the invalid case where the scale gives a float', () => {
      const v1 = Effect.runSync(NonNegativeRational.fromNonNegativeNumber(1));
      expect(Effect.runSync(unit.toUnScaledValueString(v1, TEST_SCALE, 2 as NonNegativeInteger))).toEqual('0.01');
    });
  });
});
