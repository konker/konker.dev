/**
 * Redact Tests
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  createRedactOptions,
  isSafeToShowValues,
  NOT_SET,
  REDACTED,
  redactObject,
  redactValue,
  REMOVED,
} from './redact.js';

describe('redact', () => {
  describe('constants', () => {
    it('should have correct constant values', () => {
      expect(REDACTED).toBe('<redacted>');
      expect(NOT_SET).toBe('(not set)');
      expect(REMOVED).toBe('(removed)');
    });
  });

  describe('redactValue', () => {
    describe('when showValues is false (default)', () => {
      it('should return NOT_SET for undefined', () => {
        expect(redactValue(undefined)).toBe(NOT_SET);
      });

      it('should return REDACTED for null', () => {
        expect(redactValue(null)).toBe(REDACTED);
      });

      it('should return REDACTED for string', () => {
        expect(redactValue('secret')).toBe(REDACTED);
      });

      it('should return REDACTED for number', () => {
        expect(redactValue(42)).toBe(REDACTED);
      });

      it('should return REDACTED for boolean', () => {
        expect(redactValue(true)).toBe(REDACTED);
      });

      it('should return REDACTED for object', () => {
        expect(redactValue({ key: 'value' })).toBe(REDACTED);
      });

      it('should return REDACTED for array', () => {
        expect(redactValue([1, 2, 3])).toBe(REDACTED);
      });
    });

    describe('when showValues is true', () => {
      const options = { showValues: true };

      it('should return NOT_SET for undefined', () => {
        expect(redactValue(undefined, options)).toBe(NOT_SET);
      });

      it('should return "null" for null', () => {
        expect(redactValue(null, options)).toBe('null');
      });

      it('should return string value', () => {
        expect(redactValue('secret', options)).toBe('secret');
      });

      it('should return string representation of number', () => {
        expect(redactValue(42, options)).toBe('42');
      });

      it('should return string representation of boolean', () => {
        expect(redactValue(true, options)).toBe('true');
        expect(redactValue(false, options)).toBe('false');
      });

      it('should return JSON for object', () => {
        expect(redactValue({ key: 'value' }, options)).toBe('{"key":"value"}');
      });

      it('should return JSON for array', () => {
        expect(redactValue([1, 2, 3], options)).toBe('[1,2,3]');
      });
    });

    describe('with maxLength', () => {
      const options = { showValues: true, maxLength: 10 };

      it('should not truncate short values', () => {
        expect(redactValue('short', options)).toBe('short');
      });

      it('should truncate long values', () => {
        expect(redactValue('this is a very long string', options)).toBe('this is a ...');
      });

      it('should truncate long JSON values', () => {
        expect(redactValue({ key: 'very long value here' }, options)).toBe('{"key":"ve...');
      });
    });

    describe('with default maxLength (50)', () => {
      const options = { showValues: true };

      it('should truncate values over 50 characters', () => {
        const longString = 'a'.repeat(60);
        const result = redactValue(longString, options);
        expect(result).toBe('a'.repeat(50) + '...');
      });

      it('should not truncate values under 50 characters', () => {
        const shortString = 'a'.repeat(50);
        const result = redactValue(shortString, options);
        expect(result).toBe(shortString);
      });
    });
  });

  describe('redactObject', () => {
    it('should redact all values in object when showValues is false', () => {
      const obj = {
        password: 'secret123',
        apiKey: 'key-abc',
        port: 3000,
      };

      const result = redactObject(obj);

      expect(result).toEqual({
        password: REDACTED,
        apiKey: REDACTED,
        port: REDACTED,
      });
    });

    it('should show all values when showValues is true', () => {
      const obj = {
        password: 'secret123',
        apiKey: 'key-abc',
        port: 3000,
      };

      const result = redactObject(obj, { showValues: true });

      expect(result).toEqual({
        password: 'secret123',
        apiKey: 'key-abc',
        port: '3000',
      });
    });

    it('should handle undefined values', () => {
      const obj = {
        defined: 'value',
        notDefined: undefined,
      };

      const result = redactObject(obj);

      expect(result).toEqual({
        defined: REDACTED,
        notDefined: NOT_SET,
      });
    });

    it('should handle null values', () => {
      const obj = {
        defined: 'value',
        nullValue: null,
      };

      const result = redactObject(obj, { showValues: true });

      expect(result).toEqual({
        defined: 'value',
        nullValue: 'null',
      });
    });

    it('should handle empty object', () => {
      const result = redactObject({});
      expect(result).toEqual({});
    });
  });

  describe('isSafeToShowValues', () => {
    const originalStdout = process.stdout;

    afterEach(() => {
      Object.defineProperty(process, 'stdout', { value: originalStdout });
    });

    it('should return true when unsafeShowValues is true', () => {
      expect(isSafeToShowValues(false, true)).toBe(true);
      expect(isSafeToShowValues(true, true)).toBe(true);
    });

    it('should return true when showValues is true and stdout is TTY', () => {
      Object.defineProperty(process, 'stdout', { value: { isTTY: true }, configurable: true });
      expect(isSafeToShowValues(true, false)).toBe(true);
    });

    it('should return false when showValues is true but stdout is not TTY', () => {
      Object.defineProperty(process, 'stdout', { value: { isTTY: false }, configurable: true });
      expect(isSafeToShowValues(true, false)).toBe(false);
    });

    it('should return false when showValues is false', () => {
      Object.defineProperty(process, 'stdout', { value: { isTTY: true }, configurable: true });
      expect(isSafeToShowValues(false, false)).toBe(false);
    });
  });

  describe('createRedactOptions', () => {
    const originalStdout = process.stdout;

    afterEach(() => {
      Object.defineProperty(process, 'stdout', { value: originalStdout });
    });

    it('should create options with defaults', () => {
      Object.defineProperty(process, 'stdout', { value: { isTTY: false }, configurable: true });

      const options = createRedactOptions();

      expect(options.showValues).toBe(false);
      expect(options.maxLength).toBe(50);
    });

    it('should create options with showValues when TTY', () => {
      Object.defineProperty(process, 'stdout', { value: { isTTY: true }, configurable: true });

      const options = createRedactOptions(true);

      expect(options.showValues).toBe(true);
    });

    it('should create options with showValues when unsafeShowValues', () => {
      Object.defineProperty(process, 'stdout', { value: { isTTY: false }, configurable: true });

      const options = createRedactOptions(false, true);

      expect(options.showValues).toBe(true);
    });

    it('should create options with custom maxLength', () => {
      const options = createRedactOptions(false, false, 100);

      expect(options.maxLength).toBe(100);
    });
  });
});
