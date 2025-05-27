import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

import * as unit from './NonNegativeRational.js';
import { type Nat, NAT_ONE, type NonNegativeInteger } from './number.js';

describe('NonNegativeRational', () => {
  describe('constructor', () => {
    it('should create a NonNegativeRational with valid positive integers', () => {
      const rational = unit.NonNegativeRational(123 as NonNegativeInteger, 456 as Nat);
      expect(rational).toMatchObject({
        n: 123,
        d: 456,
      });
    });

    it('should create a NonNegativeRational with zero', () => {
      const rational = unit.NonNegativeRational(0 as NonNegativeInteger, 456 as Nat);
      expect(rational).toMatchObject({
        n: 0,
        d: 456,
      });
    });
  });

  describe('fromNumberPair', () => {
    it('should create a NonNegativeRational with valid number inputs', () => {
      expect(Effect.runSync(unit.fromNumberPair(123, 456))).toStrictEqual(
        unit.NonNegativeRational(123 as NonNegativeInteger, 456 as Nat)
      );
    });

    it('should create a NonNegativeRational with valid string inputs', () => {
      expect(Effect.runSync(unit.fromNumberPair('123', '456'))).toStrictEqual(
        unit.NonNegativeRational(123 as NonNegativeInteger, 456 as Nat)
      );
    });

    it('should create a NonNegativeRational with mixed string and number inputs', () => {
      expect(Effect.runSync(unit.fromNumberPair(123, '456'))).toStrictEqual(
        unit.NonNegativeRational(123 as NonNegativeInteger, 456 as Nat)
      );
      expect(Effect.runSync(unit.fromNumberPair('123', 456))).toStrictEqual(
        unit.NonNegativeRational(123 as NonNegativeInteger, 456 as Nat)
      );
    });

    it('should create a NonNegativeRational with zero numerator', () => {
      expect(Effect.runSync(unit.fromNumberPair(0, 456))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 456 as Nat)
      );
      expect(Effect.runSync(unit.fromNumberPair('0', '456'))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 456 as Nat)
      );
    });

    it('should return an error for negative numerator', () => {
      expect(() => Effect.runSync(unit.fromNumberPair(-123, 456))).toThrow('Expected a non-negative number');

      expect(() => Effect.runSync(unit.fromNumberPair('-123', '456'))).toThrow('Expected a non-negative number');
    });

    it('should return an error for zero denominator', () => {
      expect(() => Effect.runSync(unit.fromNumberPair(123, 0))).toThrow('Expected a positive number');

      expect(() => Effect.runSync(unit.fromNumberPair('123', '0'))).toThrow('Expected a positive number');
    });

    it('should return an error for negative denominator', () => {
      expect(() => Effect.runSync(unit.fromNumberPair(123, -456))).toThrow('Expected a positive number');

      expect(() => Effect.runSync(unit.fromNumberPair('123', '-456'))).toThrow('Expected a positive number');
    });

    // it('should return an error for NonNegativeInteger parse error', () => {
    //   vi.spyOn(Schema, 'decode').mockReturnValueOnce(() => Effect.fail(new Error('Boom!')));
    //
    //   expect(() => Effect.runSync(unit.fromNumberPair(123, 456))).toThrow('Boom!');
    // });
  });

  describe('fromNonNegativeIntegerString', () => {
    it('should convert integer strings correctly', () => {
      expect(Effect.runSync(unit.fromNonNegativeIntegerString('5'))).toStrictEqual(
        unit.NonNegativeRational(5 as NonNegativeInteger, NAT_ONE)
      );
      expect(Effect.runSync(unit.fromNonNegativeIntegerString('0'))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, NAT_ONE)
      );
    });

    it('should fail on invalid input', () => {
      expect(() => Effect.runSync(unit.fromNonNegativeIntegerString('1.2'))).toThrow('Expected an integer');
    });
  });

  describe('fromNonNegativeFloatString', () => {
    it('should convert decimal numbers correctly', () => {
      expect(Effect.runSync(unit.fromNonNegativeFloatString('1.2'))).toStrictEqual(
        unit.NonNegativeRational(12 as NonNegativeInteger, 10 as Nat)
      );
      expect(Effect.runSync(unit.fromNonNegativeFloatString('1.23'))).toStrictEqual(
        unit.NonNegativeRational(123 as NonNegativeInteger, 100 as Nat)
      );
      expect(Effect.runSync(unit.fromNonNegativeFloatString('1.234'))).toStrictEqual(
        unit.NonNegativeRational(1234 as NonNegativeInteger, 1000 as Nat)
      );
      expect(Effect.runSync(unit.fromNonNegativeFloatString('123.456'))).toStrictEqual(
        unit.NonNegativeRational(123456 as NonNegativeInteger, 1000 as Nat)
      );
      expect(Effect.runSync(unit.fromNonNegativeFloatString('0.001'))).toStrictEqual(
        unit.NonNegativeRational(1 as NonNegativeInteger, 1000 as Nat)
      );
    });

    it('should fail on invalid input', () => {
      expect(() => Effect.runSync(unit.fromNonNegativeFloatString('12'))).toThrow('Expected a float string');
    });
  });

  describe('fromNonNegativeNumber', () => {
    it('should convert decimal numbers correctly', () => {
      expect(Effect.runSync(unit.fromNonNegativeNumber(1.2))).toStrictEqual(
        unit.NonNegativeRational(12 as NonNegativeInteger, 10 as Nat)
      );
      expect(Effect.runSync(unit.fromNonNegativeNumber(1.23))).toStrictEqual(
        unit.NonNegativeRational(123 as NonNegativeInteger, 100 as Nat)
      );
      expect(Effect.runSync(unit.fromNonNegativeNumber(1.234))).toStrictEqual(
        unit.NonNegativeRational(1234 as NonNegativeInteger, 1000 as Nat)
      );
      expect(Effect.runSync(unit.fromNonNegativeNumber(123.456))).toStrictEqual(
        unit.NonNegativeRational(123456 as NonNegativeInteger, 1000 as Nat)
      );
      expect(Effect.runSync(unit.fromNonNegativeNumber(0.001))).toStrictEqual(
        unit.NonNegativeRational(1 as NonNegativeInteger, 1000 as Nat)
      );
    });

    it('should convert decimal number with float error', () => {
      expect(Effect.runSync(unit.fromNonNegativeNumber(1.11))).toStrictEqual(
        unit.NonNegativeRational(111 as NonNegativeInteger, 100 as Nat)
      );
    });

    it('should convert integer numbers correctly', () => {
      expect(Effect.runSync(unit.fromNonNegativeNumber(5))).toStrictEqual(
        unit.NonNegativeRational(5 as NonNegativeInteger, 1 as Nat)
      );
      expect(Effect.runSync(unit.fromNonNegativeNumber(0))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 1 as Nat)
      );
    });

    it('should handle string inputs', () => {
      expect(Effect.runSync(unit.fromNonNegativeNumber('7.89'))).toStrictEqual(
        unit.NonNegativeRational(789 as NonNegativeInteger, 100 as Nat)
      );

      expect(Effect.runSync(unit.fromNonNegativeNumber('.89'))).toStrictEqual(
        unit.NonNegativeRational(89 as NonNegativeInteger, 100 as Nat)
      );
    });

    it('should return an error for negative numbers', () => {
      expect(() => Effect.runSync(unit.fromNonNegativeNumber(-1.23))).toThrow('Expected a non-negative number');
    });
  });

  describe('toLowestCommonDenominator', () => {
    it('should convert two rationals to the lowest common denominator', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      const b = unit.NonNegativeRational(5 as NonNegativeInteger, 7 as Nat);
      const [lcdA, lcdB, lcd] = Effect.runSync(unit.getLowestCommonDenominator(a, b));

      expect(lcd).toEqual(21); // LCM of 3 and 7 is 21
      expect(lcdA).toStrictEqual(unit.NonNegativeRational(14 as NonNegativeInteger, 21 as Nat)); // 2/3 * 7/7 = 14/21
      expect(lcdB).toStrictEqual(unit.NonNegativeRational(15 as NonNegativeInteger, 21 as Nat)); // 5/7 * 3/3 = 15/21
    });

    it('should handle rationals with the same denominator', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 5 as Nat);
      const b = unit.NonNegativeRational(3 as NonNegativeInteger, 5 as Nat);
      const [lcdA, lcdB, lcd] = Effect.runSync(unit.getLowestCommonDenominator(a, b));

      expect(lcd).toEqual(5); // LCM of 5 and 5 is 5
      expect(lcdA).toStrictEqual(unit.NonNegativeRational(2 as NonNegativeInteger, 5 as Nat)); // No change needed
      expect(lcdB).toStrictEqual(unit.NonNegativeRational(3 as NonNegativeInteger, 5 as Nat)); // No change needed
    });

    it('should handle when one denominator is a multiple of the other', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 4 as Nat);
      const b = unit.NonNegativeRational(3 as NonNegativeInteger, 8 as Nat);
      const [lcdA, lcdB, lcd] = Effect.runSync(unit.getLowestCommonDenominator(a, b));

      expect(lcd).toEqual(8); // LCM of 4 and 8 is 8
      expect(lcdA).toStrictEqual(unit.NonNegativeRational(4 as NonNegativeInteger, 8 as Nat)); // 2/4 * 2/2 = 4/8
      expect(lcdB).toStrictEqual(unit.NonNegativeRational(3 as NonNegativeInteger, 8 as Nat)); // No change needed
    });

    it('should handle zero numerators', () => {
      const a = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);
      const b = unit.NonNegativeRational(5 as NonNegativeInteger, 7 as Nat);
      const [lcdA, lcdB, lcd] = Effect.runSync(unit.getLowestCommonDenominator(a, b));

      expect(lcd).toEqual(21); // LCM of 3 and 7 is 21
      expect(lcdA).toStrictEqual(unit.NonNegativeRational(0 as NonNegativeInteger, 21 as Nat)); // 0/3 * 7/7 = 0/21
      expect(lcdB).toStrictEqual(unit.NonNegativeRational(15 as NonNegativeInteger, 21 as Nat)); // 5/7 * 3/3 = 15/21

      // Both numerators are zero
      const c = unit.NonNegativeRational(0 as NonNegativeInteger, 4 as Nat);
      const d = unit.NonNegativeRational(0 as NonNegativeInteger, 6 as Nat);
      const [lcdC, lcdD, lcdCD] = Effect.runSync(unit.getLowestCommonDenominator(c, d));

      expect(lcdCD).toEqual(12); // LCM of 4 and 6 is 12
      expect(lcdC).toStrictEqual(unit.NonNegativeRational(0 as NonNegativeInteger, 12 as Nat)); // 0/4 * 3/3 = 0/12
      expect(lcdD).toStrictEqual(unit.NonNegativeRational(0 as NonNegativeInteger, 12 as Nat)); // 0/6 * 2/2 = 0/12
    });

    it('should handle large denominators', () => {
      const a = unit.NonNegativeRational(7 as NonNegativeInteger, 360 as Nat);
      const b = unit.NonNegativeRational(13 as NonNegativeInteger, 420 as Nat);
      const [lcdA, lcdB, lcd] = Effect.runSync(unit.getLowestCommonDenominator(a, b));

      expect(lcd).toEqual(2520); // LCM of 360 and 420 is 2520
      expect(lcdA).toStrictEqual(unit.NonNegativeRational(49 as NonNegativeInteger, 2520 as Nat)); // 7/360 * 7/7 = 49/2520
      expect(lcdB).toStrictEqual(unit.NonNegativeRational(78 as NonNegativeInteger, 2520 as Nat)); // 13/420 * 6/6 = 78/2520
    });

    it('should handle rationals that are already in lowest form', () => {
      // Create two rationals that already have the LCD
      const lcd = 12;
      const a = unit.NonNegativeRational(5 as NonNegativeInteger, lcd as Nat);
      const b = unit.NonNegativeRational(7 as NonNegativeInteger, lcd as Nat);
      const [lcdA, lcdB, resultLcd] = Effect.runSync(unit.getLowestCommonDenominator(a, b));

      expect(resultLcd).toEqual(lcd);
      expect(lcdA).toStrictEqual(a); // Should be unchanged
      expect(lcdB).toStrictEqual(b); // Should be unchanged
    });

    // it('ARTIFICIAL: should fail as expected given a NatParse error', () => {
    //   vi.spyOn(number, 'Nat').mockReturnValueOnce(Effect.fail(new Error('Boom!')));
    //
    //   const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
    //   const b = unit.NonNegativeRational(5 as NonNegativeInteger, 7 as Nat);
    //   const actual = unit.getLowestCommonDenominator(a, b);
    //
    //   expect(() => Effect.runSync(actual)).toThrow('Boom!');
    // });

    // it('ARTIFICIAL: should fail as expected given a NatParse error', () => {
    //   vi.spyOn(number, 'Nat')
    //     .mockReturnValueOnce(Effect.succeed(7 as Nat))
    //     .mockReturnValueOnce(Effect.fail(new Error('Kaboom!')));
    //
    //   const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
    //   const b = unit.NonNegativeRational(5 as NonNegativeInteger, 7 as Nat);
    //   const actual = unit.getLowestCommonDenominator(a, b);
    //
    //   expect(() => Effect.runSync(actual)).toThrow('Kaboom!');
    // });
    //
    // it('ARTIFICIAL: should fail as expected given a bad mul calculation', () => {
    //   vi.spyOn(number, 'lcm').mockReturnValueOnce(Effect.succeed(3 as Nat));
    //
    //   const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
    //   const b = unit.NonNegativeRational(5 as NonNegativeInteger, 7 as Nat);
    //   const actual = unit.getLowestCommonDenominator(a, b);
    //
    //   expect(() => Effect.runSync(actual)).toThrow('invalid_type');
    // });
    //
    // it.skip('ARTIFICIAL: should fail as expected given a bad mul calculation', () => {
    //   vi.spyOn(unit, 'mul')
    //     .mockReturnValueOnce(Effect.succeed(unit.NonNegativeRational(14 as NonNegativeInteger, 21 as Nat)))
    //     .mockReturnValueOnce(Effect.fail(new Error('Kaboom!')));
    //
    //   const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
    //   const b = unit.NonNegativeRational(5 as NonNegativeInteger, 7 as Nat);
    //   const actual = unit.getLowestCommonDenominator(a, b);
    //
    //   expect(() => Effect.runSync(actual)).toThrow('Kaboom!');
    // });
  });

  describe('reciprocal', () => {
    it('should work as expected with non-zero values', () => {
      const x = unit.NonNegativeRational(123 as NonNegativeInteger, 456 as Nat);
      expect(Effect.runSync(unit.reciprocal(x))).toStrictEqual(
        unit.NonNegativeRational(456 as NonNegativeInteger, 123 as Nat)
      );
    });

    it('should fail with zero', () => {
      const x = unit.NonNegativeRational(0 as NonNegativeInteger, 456 as Nat);
      expect(() => Effect.runSync(unit.reciprocal(x))).toThrow('Expected a positive number');
    });
  });

  describe('mul', () => {
    it('should multiply two rationals correctly', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      const b = unit.NonNegativeRational(4 as NonNegativeInteger, 5 as Nat);
      expect(Effect.runSync(unit.mul(a, b))).toStrictEqual(
        unit.NonNegativeRational(8 as NonNegativeInteger, 15 as Nat)
      );
    });

    it('should handle zero in numerator', () => {
      const a = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);
      const b = unit.NonNegativeRational(4 as NonNegativeInteger, 5 as Nat);
      expect(Effect.runSync(unit.mul(a, b))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 15 as Nat)
      );
    });
  });

  describe('mulNat', () => {
    it('should multiply a rational by a natural number', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      expect(Effect.runSync(unit.mulNat(a, 4 as Nat))).toStrictEqual(
        unit.NonNegativeRational(8 as NonNegativeInteger, 3 as Nat)
      );
    });

    it('should handle zero in numerator', () => {
      const a = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);
      expect(Effect.runSync(unit.mulNat(a, 4 as Nat))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat)
      );
    });
  });

  describe('mulNonNegativeNumber', () => {
    it('should multiply a rational by a non-negative number', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      // 1.5 is converted to 15/10, so the result is (2/3) * (15/10) = 30/30
      expect(Effect.runSync(unit.mulNonNegativeNumber(a, 1.5))).toStrictEqual(
        unit.NonNegativeRational(30 as NonNegativeInteger, 30 as Nat)
      );
    });

    it('should handle zero in either operand', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      // 0 is converted to 0/1, so the result is (2/3) * (0/1) = 0/3
      expect(Effect.runSync(unit.mulNonNegativeNumber(a, 0))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat)
      );

      const b = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);
      // 1.5 is converted to 15/10, so the result is (0/3) * (15/10) = 0/30
      expect(Effect.runSync(unit.mulNonNegativeNumber(b, 1.5))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 30 as Nat)
      );
    });
  });

  describe('div', () => {
    it('should divide two rationals correctly', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      const b = unit.NonNegativeRational(4 as NonNegativeInteger, 5 as Nat);
      expect(Effect.runSync(unit.div(a, b))).toStrictEqual(
        unit.NonNegativeRational(10 as NonNegativeInteger, 12 as Nat)
      );
    });

    it('should handle zero in numerator of first operand', () => {
      const a = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);
      const b = unit.NonNegativeRational(4 as NonNegativeInteger, 5 as Nat);
      expect(Effect.runSync(unit.div(a, b))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 12 as Nat)
      );
    });

    it('should throw when dividing by zero', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      const b = unit.NonNegativeRational(0 as NonNegativeInteger, 5 as Nat);
      expect(() => Effect.runSync(unit.div(a, b))).toThrow('Expected a positive number');
    });
  });

  describe('divNat', () => {
    it('should divide a rational by a natural number', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      expect(Effect.runSync(unit.divNat(a, 4 as Nat))).toStrictEqual(
        unit.NonNegativeRational(2 as NonNegativeInteger, 12 as Nat)
      );
    });

    it('should handle zero in numerator', () => {
      const a = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);
      expect(Effect.runSync(unit.divNat(a, 4 as Nat))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 12 as Nat)
      );
    });
  });

  describe('divNonNegativeNumber', () => {
    it('should divide a rational by a non-negative number', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      // 0.5 is converted to 5/10, so the result is (2/3) / (5/10) = (2/3) * (10/5) = 20/15
      expect(Effect.runSync(unit.divNonNegativeNumber(a, 0.5))).toStrictEqual(
        unit.NonNegativeRational(20 as NonNegativeInteger, 15 as Nat)
      );
    });

    it('should handle zero in numerator', () => {
      const a = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);
      // 0.5 is converted to 5/10, so the result is (0/3) / (5/10) = (0/3) * (10/5) = 0/15
      expect(Effect.runSync(unit.divNonNegativeNumber(a, 0.5))).toStrictEqual(
        unit.NonNegativeRational(0 as NonNegativeInteger, 15 as Nat)
      );
    });

    it('should throw when dividing by zero', () => {
      const a = unit.NonNegativeRational(2 as NonNegativeInteger, 3 as Nat);
      expect(() => Effect.runSync(unit.divNonNegativeNumber(a, 0))).toThrow('Expected a positive number');
    });
  });

  describe('add', () => {
    it('should add two rationals correctly', () => {
      const a = unit.NonNegativeRational(1 as NonNegativeInteger, 2 as Nat);
      const b = unit.NonNegativeRational(1 as NonNegativeInteger, 3 as Nat);
      expect(Effect.runSync(unit.add(a, b))).toStrictEqual(unit.NonNegativeRational(5 as NonNegativeInteger, 6 as Nat));
    });

    it('should add two rationals correctly', () => {
      const a = unit.NonNegativeRational(150 as NonNegativeInteger, 5 as Nat);
      const b = unit.NonNegativeRational(150 as NonNegativeInteger, 3 as Nat);
      expect(Effect.runSync(unit.add(a, b))).toStrictEqual(
        unit.NonNegativeRational(1200 as NonNegativeInteger, 15 as Nat)
      );
    });

    it('should handle zero in one operand', () => {
      const a = unit.NonNegativeRational(1 as NonNegativeInteger, 2 as Nat);
      const b = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);
      expect(Effect.runSync(unit.add(a, b))).toStrictEqual(unit.NonNegativeRational(3 as NonNegativeInteger, 6 as Nat));
    });

    it('should handle zero in both operands', () => {
      const a = unit.NonNegativeRational(0 as NonNegativeInteger, 2 as Nat);
      const b = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);

      expect(Effect.runSync(unit.add(a, b))).toStrictEqual(unit.NonNegativeRational(0 as NonNegativeInteger, 6 as Nat));
    });

    it.skip('ARTIFICIAL: should fail as expected given a toLowestCommonDenominator error', () => {
      vi.spyOn(unit, 'getLowestCommonDenominator').mockReturnValueOnce(Effect.fail(new Error('Boom!')));

      const a = unit.NonNegativeRational(1 as NonNegativeInteger, 2 as Nat);
      const b = unit.NonNegativeRational(1 as NonNegativeInteger, 3 as Nat);
      expect(() => Effect.runSync(unit.add(a, b))).toThrow('Boom!');
    });
  });

  describe('sub', () => {
    it('should subtract two rationals correctly', () => {
      const a = unit.NonNegativeRational(3 as NonNegativeInteger, 4 as Nat);
      const b = unit.NonNegativeRational(1 as NonNegativeInteger, 4 as Nat);
      expect(Effect.runSync(unit.sub(a, b))).toStrictEqual(unit.NonNegativeRational(2 as NonNegativeInteger, 4 as Nat));
    });

    it('should handle equal values', () => {
      const a = unit.NonNegativeRational(1 as NonNegativeInteger, 2 as Nat);
      const b = unit.NonNegativeRational(1 as NonNegativeInteger, 2 as Nat);
      expect(Effect.runSync(unit.sub(a, b))).toStrictEqual(unit.NonNegativeRational(0 as NonNegativeInteger, 2 as Nat));
    });

    it('should handle zero in subtrahend', () => {
      const a = unit.NonNegativeRational(1 as NonNegativeInteger, 2 as Nat);
      const b = unit.NonNegativeRational(0 as NonNegativeInteger, 3 as Nat);
      expect(Effect.runSync(unit.sub(a, b))).toStrictEqual(unit.NonNegativeRational(3 as NonNegativeInteger, 6 as Nat));
    });

    it('should throw when result would be negative', () => {
      const a = unit.NonNegativeRational(1 as NonNegativeInteger, 4 as Nat);
      const b = unit.NonNegativeRational(3 as NonNegativeInteger, 4 as Nat);
      expect(() => Effect.runSync(unit.sub(a, b))).toThrow('Expected a non-negative number');
    });

    it.skip('ARTIFICIAL: should fail as expected given a toLowestCommonDenominator error', () => {
      vi.spyOn(unit, 'getLowestCommonDenominator').mockReturnValueOnce(Effect.fail(new Error('Boom!')));

      const a = unit.NonNegativeRational(1 as NonNegativeInteger, 2 as Nat);
      const b = unit.NonNegativeRational(1 as NonNegativeInteger, 3 as Nat);
      expect(() => Effect.runSync(unit.sub(a, b))).toThrow('Boom!');
    });
  });
});
