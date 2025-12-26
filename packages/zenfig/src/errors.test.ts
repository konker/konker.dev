/**
 * Error System Tests
 */
import { describe, expect, it } from 'vitest';

import {
  ErrorCode,
  errorCodeToExitCode,
  EXIT_AUTH_ERROR,
  EXIT_CONFIG_ERROR,
  EXIT_FILE_ERROR,
  EXIT_SCHEMA_MISMATCH,
  EXIT_SUCCESS,
  EXIT_VALIDATION_ERROR,
  formatError,
  invalidTypeError,
  keyNotFoundError,
  ValidationError,
} from './errors.js';

describe('errors', () => {
  describe('errorCodeToExitCode', () => {
    it('should map CLI errors to EXIT_CONFIG_ERROR', () => {
      expect(errorCodeToExitCode(ErrorCode.CLI001)).toBe(EXIT_CONFIG_ERROR);
      expect(errorCodeToExitCode(ErrorCode.CLI002)).toBe(EXIT_CONFIG_ERROR);
      expect(errorCodeToExitCode(ErrorCode.CLI003)).toBe(EXIT_CONFIG_ERROR);
    });

    it('should map SYS001-003 to EXIT_FILE_ERROR', () => {
      expect(errorCodeToExitCode(ErrorCode.SYS001)).toBe(EXIT_FILE_ERROR);
      expect(errorCodeToExitCode(ErrorCode.SYS002)).toBe(EXIT_FILE_ERROR);
      expect(errorCodeToExitCode(ErrorCode.SYS003)).toBe(EXIT_FILE_ERROR);
    });

    it('should map SYS004 to EXIT_SCHEMA_MISMATCH', () => {
      expect(errorCodeToExitCode(ErrorCode.SYS004)).toBe(EXIT_SCHEMA_MISMATCH);
    });

    it('should map PROV001-002-005 to EXIT_AUTH_ERROR', () => {
      expect(errorCodeToExitCode(ErrorCode.PROV001)).toBe(EXIT_AUTH_ERROR);
      expect(errorCodeToExitCode(ErrorCode.PROV002)).toBe(EXIT_AUTH_ERROR);
      expect(errorCodeToExitCode(ErrorCode.PROV005)).toBe(EXIT_AUTH_ERROR);
    });

    it('should default to EXIT_VALIDATION_ERROR', () => {
      expect(errorCodeToExitCode(ErrorCode.VAL001)).toBe(EXIT_VALIDATION_ERROR);
      expect(errorCodeToExitCode(ErrorCode.VAL002)).toBe(EXIT_VALIDATION_ERROR);
      expect(errorCodeToExitCode(ErrorCode.JSON001)).toBe(EXIT_VALIDATION_ERROR);
    });
  });

  describe('ValidationError', () => {
    it('should create with correct properties', () => {
      const error = new ValidationError({
        message: 'Test error',
        context: {
          code: ErrorCode.VAL001,
          path: 'test.path',
          expected: 'string',
          received: '123',
        },
      });

      expect(error._tag).toBe('ValidationError');
      expect(error.message).toBe('Test error');
      expect(error.context.code).toBe(ErrorCode.VAL001);
      expect(error.context.path).toBe('test.path');
      expect(error.exitCode).toBe(EXIT_VALIDATION_ERROR);
    });
  });

  describe('error factory functions', () => {
    it('invalidTypeError should create correct error', () => {
      const error = invalidTypeError('db.port', 'number', '"8080"');

      expect(error.context.code).toBe(ErrorCode.VAL001);
      expect(error.context.path).toBe('db.port');
      expect(error.context.expected).toBe('number');
      expect(error.context.received).toBe('"8080"');
    });

    it('keyNotFoundError should include available keys', () => {
      const error = keyNotFoundError('unknown.key', ['known.a', 'known.b']);

      expect(error.context.code).toBe(ErrorCode.VAL004);
      expect(error.context.path).toBe('unknown.key');
      expect(error.context.availableKeys).toEqual(['known.a', 'known.b']);
    });
  });

  describe('formatError', () => {
    it('should format error with all fields', () => {
      const error = invalidTypeError('db.port', 'number', '"8080"');
      const formatted = formatError(error);

      expect(formatted).toContain('Validation Error [VAL001]');
      expect(formatted).toContain('db.port');
      expect(formatted).toContain('Expected: number');
      expect(formatted).toContain('Received: "8080"');
    });

    it('should format error with available keys', () => {
      const error = keyNotFoundError('unknown.key', ['known.a', 'known.b', 'known.c']);
      const formatted = formatError(error);

      expect(formatted).toContain('Available keys:');
      expect(formatted).toContain('known.a');
      expect(formatted).toContain('known.b');
    });
  });

  describe('exit codes', () => {
    it('should have correct values', () => {
      expect(EXIT_SUCCESS).toBe(0);
      expect(EXIT_VALIDATION_ERROR).toBe(1);
      expect(EXIT_CONFIG_ERROR).toBe(2);
      expect(EXIT_FILE_ERROR).toBe(3);
      expect(EXIT_AUTH_ERROR).toBe(4);
      expect(EXIT_SCHEMA_MISMATCH).toBe(5);
    });
  });
});
