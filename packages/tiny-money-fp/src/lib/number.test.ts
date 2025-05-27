import { Effect, Schema } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './number.js';

describe('number', () => {
  describe('Numeric', () => {
    it('should encode as expected', () => {
      expect(Schema.decodeUnknownSync(unit.NumericInt)(123)).toEqual(123);
    });

    it('should decode as expected', () => {
      expect(Schema.encodeSync(unit.NumericInt)(123)).toEqual(123);
    });
  });

  describe('Nat', () => {
    it('should work as expected', () => {
      expect(Schema.decodeUnknownSync(unit.Nat)(123)).toEqual(123);
      expect(Schema.decodeUnknownSync(unit.Nat)('123')).toEqual(123);
      expect(() => Schema.decodeUnknownSync(unit.Nat)(1.23)).toThrow('Expected an integer');
      expect(() => Schema.decodeUnknownSync(unit.Nat)('1.23')).toThrow('Expected an integer');
      expect(() => Schema.decodeUnknownSync(unit.Nat)(0)).toThrow('Expected a positive number');
      expect(() => Schema.decodeUnknownSync(unit.Nat)(-123)).toThrow('Expected a positive number');
    });
  });

  describe('PositiveInteger', () => {
    it('should work as expected', () => {
      expect(Schema.decodeUnknownSync(unit.NonNegativeInteger)(123)).toEqual(123);
      expect(Schema.decodeUnknownSync(unit.NonNegativeInteger)('123')).toEqual(123);
      expect(() => Schema.decodeUnknownSync(unit.NonNegativeInteger)(1.23)).toThrow('Expected an integer');
      expect(() => Schema.decodeUnknownSync(unit.NonNegativeInteger)('1.23')).toThrow('Expected an integer');
      expect(Schema.decodeUnknownSync(unit.NonNegativeInteger)(0)).toEqual(0);
      expect(() => Schema.decodeUnknownSync(unit.NonNegativeInteger)(-123)).toThrow('Expected a non-negative number');
    });
  });

  describe('NonNegativeNumber', () => {
    it('should work as expected', () => {
      expect(Schema.decodeUnknownSync(unit.NonNegativeNumber)(123)).toEqual(123);
      expect(Schema.decodeUnknownSync(unit.NonNegativeNumber)(1.23)).toEqual(1.23);
      expect(Schema.decodeUnknownSync(unit.NonNegativeNumber)(0)).toEqual(0);
      expect(() => Schema.decodeUnknownSync(unit.NonNegativeNumber)(-123)).toThrow('Expected a non-negative number');
    });
  });

  describe('gcd', () => {
    it('should work as expected', () => {
      // Common case - GCD of 12 and 8 is 4
      expect(Effect.runSync(unit.gcd(12, 8))).toEqual(4);

      // One number is a multiple of the other
      expect(Effect.runSync(unit.gcd(10, 5))).toEqual(5);
      expect(Effect.runSync(unit.gcd(15, 5))).toEqual(5);

      // Coprime numbers (GCD is 1)
      expect(Effect.runSync(unit.gcd(7, 13))).toEqual(1);
      expect(Effect.runSync(unit.gcd(17, 23))).toEqual(1);

      // One number is 0 (GCD is the other number)
      expect(Effect.runSync(unit.gcd(5, 0))).toEqual(5);
      expect(Effect.runSync(unit.gcd(0, 7))).toEqual(7);

      // Larger numbers
      expect(Effect.runSync(unit.gcd(48, 18))).toEqual(6);
      expect(Effect.runSync(unit.gcd(144, 36))).toEqual(36);

      // Equal numbers
      expect(Effect.runSync(unit.gcd(9, 9))).toEqual(9);
    });
  });

  describe('lcm', () => {
    it('should work as expected', () => {
      // Common case - LCM of 12 and 8 is 24
      expect(Effect.runSync(unit.lcm(12, 8))).toEqual(24);

      // One number is a multiple of the other
      expect(Effect.runSync(unit.lcm(10, 5))).toEqual(10);
      expect(Effect.runSync(unit.lcm(15, 5))).toEqual(15);

      // Coprime numbers (LCM is their product)
      expect(Effect.runSync(unit.lcm(7, 13))).toEqual(91);
      expect(Effect.runSync(unit.lcm(17, 23))).toEqual(391);

      // One number is 0 (should throw error since LCM would be 0, which is not a Nat)
      expect(() => Effect.runSync(unit.lcm(5, 0))).toThrow();
      expect(() => Effect.runSync(unit.lcm(0, 7))).toThrow();

      // Larger numbers
      expect(Effect.runSync(unit.lcm(48, 18))).toEqual(144);
      expect(Effect.runSync(unit.lcm(144, 36))).toEqual(144);

      // Equal numbers
      expect(Effect.runSync(unit.lcm(9, 9))).toEqual(9);
    });
  });
});
