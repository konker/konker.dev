/**
 * Error System Tests
 */
import { describe, expect, it } from 'vitest';

import {
  authenticationFailedError,
  binaryNotFoundError,
  CLIError,
  conflictingFlagsError,
  connectionFailedError,
  constraintViolationError,
  encryptionVerificationFailedError,
  ErrorCode,
  errorCodeToExitCode,
  EXIT_AUTH_ERROR,
  EXIT_CONFIG_ERROR,
  EXIT_FILE_ERROR,
  EXIT_SCHEMA_MISMATCH,
  EXIT_SUCCESS,
  EXIT_VALIDATION_ERROR,
  fileNotFoundError,
  formatError,
  formatViolationError,
  invalidFlagError,
  invalidKeyPathError,
  invalidTypeError,
  JsonnetError,
  jsonnetInvalidOutputError,
  jsonnetMissingVariableError,
  jsonnetRuntimeError,
  jsonnetSyntaxError,
  keyNotFoundError,
  missingRequiredArgumentError,
  nullNotAllowedError,
  parameterNotFoundError,
  permissionDeniedError,
  ProviderError,
  providerGuardMismatchError,
  snapshotSchemaMismatchError,
  SystemError,
  unknownKeysError,
  ValidationError,
  writePermissionDeniedError,
  ZenfigError,
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

    it('should map PROV006 to EXIT_CONFIG_ERROR', () => {
      expect(errorCodeToExitCode(ErrorCode.PROV006)).toBe(EXIT_CONFIG_ERROR);
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
    describe('validation errors', () => {
      it('invalidTypeError should create correct error', () => {
        const error = invalidTypeError('db.port', 'number', '"8080"');

        expect(error.context.code).toBe(ErrorCode.VAL001);
        expect(error.context.path).toBe('db.port');
        expect(error.context.expected).toBe('number');
        expect(error.context.received).toBe('"8080"');
      });

      it('formatViolationError should create correct error', () => {
        const error = formatViolationError('email', 'email', 'invalid', 'user@example.com');

        expect(error.context.code).toBe(ErrorCode.VAL002);
        expect(error.context.path).toBe('email');
        expect(error.context.expected).toBe('email');
        expect(error.context.received).toBe('invalid');
        expect(error.context.example).toBe('user@example.com');
      });

      it('constraintViolationError should create correct error', () => {
        const error = constraintViolationError('age', 'minimum: 0', '-5', 'Value must be non-negative');

        expect(error.context.code).toBe(ErrorCode.VAL003);
        expect(error.context.path).toBe('age');
        expect(error.context.expected).toBe('minimum: 0');
        expect(error.context.received).toBe('-5');
        expect(error.context.problem).toBe('Value must be non-negative');
      });

      it('keyNotFoundError should include available keys', () => {
        const error = keyNotFoundError('unknown.key', ['known.a', 'known.b']);

        expect(error.context.code).toBe(ErrorCode.VAL004);
        expect(error.context.path).toBe('unknown.key');
        expect(error.context.availableKeys).toEqual(['known.a', 'known.b']);
      });

      it('keyNotFoundError should work without available keys', () => {
        const error = keyNotFoundError('unknown.key');

        expect(error.context.code).toBe(ErrorCode.VAL004);
        expect(error.context.availableKeys).toBeUndefined();
      });

      it('invalidKeyPathError should create correct error', () => {
        const error = invalidKeyPathError('bad/key', "Invalid key segment '/'");

        expect(error.context.code).toBe(ErrorCode.VAL004);
        expect(error.context.path).toBe('bad/key');
        expect(error.context.problem).toContain('Invalid key segment');
      });

      it('unknownKeysError should create correct error', () => {
        const error = unknownKeysError(['unknown.a', 'unknown.b']);

        expect(error.context.code).toBe(ErrorCode.VAL004);
        expect(error.context.path).toBe('unknown.a');
        expect(error.context.problem).toContain('unknown.a');
        expect(error.context.problem).toContain('unknown.b');
      });

      it('nullNotAllowedError should create correct error', () => {
        const error = nullNotAllowedError('name', 'string');

        expect(error.context.code).toBe(ErrorCode.VAL005);
        expect(error.context.path).toBe('name');
        expect(error.context.expected).toBe('string');
        expect(error.context.received).toBe('null');
      });
    });

    describe('provider errors', () => {
      it('connectionFailedError should create correct error', () => {
        const error = connectionFailedError('aws-ssm', 'Network timeout');

        expect(error.context.code).toBe(ErrorCode.PROV001);
        expect(error.context.problem).toBe('Network timeout');
      });

      it('connectionFailedError should use default message', () => {
        const error = connectionFailedError('aws-ssm');

        expect(error.context.code).toBe(ErrorCode.PROV001);
        expect(error.context.problem).toContain('ssm');
      });

      it('authenticationFailedError should create correct error', () => {
        const error = authenticationFailedError('aws', 'Invalid credentials');

        expect(error.context.code).toBe(ErrorCode.PROV002);
        expect(error.context.problem).toBe('Invalid credentials');
      });

      it('authenticationFailedError should use default message', () => {
        const error = authenticationFailedError('aws-ssm');

        expect(error.context.code).toBe(ErrorCode.PROV002);
        expect(error.context.problem).toContain('aws-ssm');
      });

      it('parameterNotFoundError should create correct error', () => {
        const error = parameterNotFoundError('db.password', '/zenfig/prod/api/db/password');

        expect(error.context.code).toBe(ErrorCode.PROV003);
        expect(error.context.path).toBe('db.password');
        expect(error.context.problem).toContain('/zenfig/prod/api/db/password');
      });

      it('encryptionVerificationFailedError should create correct error', () => {
        const error = encryptionVerificationFailedError('db.password');

        expect(error.context.code).toBe(ErrorCode.PROV004);
        expect(error.context.path).toBe('db.password');
      });

      it('writePermissionDeniedError should create correct error', () => {
        const error = writePermissionDeniedError('db.password', 'IAM policy denied');

        expect(error.context.code).toBe(ErrorCode.PROV005);
        expect(error.context.path).toBe('db.password');
        expect(error.context.problem).toBe('IAM policy denied');
      });

      it('writePermissionDeniedError should use default message', () => {
        const error = writePermissionDeniedError('db.password');

        expect(error.context.code).toBe(ErrorCode.PROV005);
        expect(error.context.problem).toBe('Write permission denied');
      });

      it('providerGuardMismatchError should create correct error', () => {
        const error = providerGuardMismatchError('aws-ssm', 'accountId mismatch');

        expect(error.context.code).toBe(ErrorCode.PROV006);
        expect(error.context.problem).toContain('aws-ssm');
        expect(error.context.problem).toContain('accountId mismatch');
      });
    });

    describe('jsonnet errors', () => {
      it('jsonnetSyntaxError should create correct error', () => {
        const error = jsonnetSyntaxError('config.jsonnet:10:5', 'Unexpected token');

        expect(error.context.code).toBe(ErrorCode.JSON001);
        expect(error.context.location).toBe('config.jsonnet:10:5');
        expect(error.context.problem).toBe('Unexpected token');
      });

      it('jsonnetRuntimeError should create correct error', () => {
        const error = jsonnetRuntimeError('config.jsonnet:20:10', 'Division by zero');

        expect(error.context.code).toBe(ErrorCode.JSON002);
        expect(error.context.location).toBe('config.jsonnet:20:10');
        expect(error.context.problem).toBe('Division by zero');
      });

      it('jsonnetInvalidOutputError should create correct error', () => {
        const error = jsonnetInvalidOutputError('"string"');

        expect(error.context.code).toBe(ErrorCode.JSON003);
        expect(error.context.expected).toBe('JSON object');
        expect(error.context.received).toBe('"string"');
      });

      it('jsonnetMissingVariableError should create correct error', () => {
        const error = jsonnetMissingVariableError('env');

        expect(error.context.code).toBe(ErrorCode.JSON004);
        expect(error.context.problem).toContain('env');
      });
    });

    describe('CLI errors', () => {
      it('invalidFlagError should create correct error', () => {
        const error = invalidFlagError('--unknown');

        expect(error.context.code).toBe(ErrorCode.CLI001);
        expect(error.context.problem).toContain('--unknown');
      });

      it('missingRequiredArgumentError should create correct error', () => {
        const error = missingRequiredArgumentError('--env', 'push');

        expect(error.context.code).toBe(ErrorCode.CLI002);
        expect(error.context.problem).toContain('--env');
        expect(error.context.remediation).toContain('push');
      });

      it('conflictingFlagsError should create correct error', () => {
        const error = conflictingFlagsError(['--json', '--env-format']);

        expect(error.context.code).toBe(ErrorCode.CLI003);
        expect(error.context.problem).toContain('--json');
        expect(error.context.problem).toContain('--env-format');
      });
    });

    describe('system errors', () => {
      it('binaryNotFoundError should create correct error for jsonnet', () => {
        const error = binaryNotFoundError('jsonnet');

        expect(error.context.code).toBe(ErrorCode.SYS001);
        expect(error.context.problem).toContain('jsonnet');
        expect(error.context.remediation).toContain('go-jsonnet');
      });

      it('binaryNotFoundError should create correct error for other binaries', () => {
        const error = binaryNotFoundError('custom-bin');

        expect(error.context.code).toBe(ErrorCode.SYS001);
        expect(error.context.problem).toContain('custom-bin');
        expect(error.context.remediation).toContain('custom-bin');
      });

      it('fileNotFoundError should create correct error', () => {
        const error = fileNotFoundError('/path/to/file.json');

        expect(error.context.code).toBe(ErrorCode.SYS002);
        expect(error.context.path).toBe('/path/to/file.json');
        expect(error.context.problem).toContain('/path/to/file.json');
      });

      it('permissionDeniedError should create correct error', () => {
        const error = permissionDeniedError('/path/to/file', 'read');

        expect(error.context.code).toBe(ErrorCode.SYS003);
        expect(error.context.path).toBe('/path/to/file');
        expect(error.context.problem).toContain('read');
      });

      it('snapshotSchemaMismatchError should create correct error', () => {
        const error = snapshotSchemaMismatchError('abc123', 'def456');

        expect(error.context.code).toBe(ErrorCode.SYS004);
        expect(error.context.expected).toBe('abc123');
        expect(error.context.received).toBe('def456');
      });
    });
  });

  describe('error classes', () => {
    it('ZenfigError should have correct exitCode', () => {
      const error = new ZenfigError({
        message: 'Test',
        context: { code: ErrorCode.VAL001 },
      });
      expect(error.exitCode).toBe(EXIT_VALIDATION_ERROR);
    });

    it('ProviderError should have correct tag', () => {
      const error = new ProviderError({
        message: 'Test',
        context: { code: ErrorCode.PROV001 },
      });
      expect(error._tag).toBe('ProviderError');
      expect(error.exitCode).toBe(EXIT_AUTH_ERROR);
    });

    it('JsonnetError should have correct tag', () => {
      const error = new JsonnetError({
        message: 'Test',
        context: { code: ErrorCode.JSON001 },
      });
      expect(error._tag).toBe('JsonnetError');
      expect(error.exitCode).toBe(EXIT_VALIDATION_ERROR);
    });

    it('CLIError should have correct tag', () => {
      const error = new CLIError({
        message: 'Test',
        context: { code: ErrorCode.CLI001 },
      });
      expect(error._tag).toBe('CLIError');
      expect(error.exitCode).toBe(EXIT_CONFIG_ERROR);
    });

    it('SystemError should have correct tag', () => {
      const error = new SystemError({
        message: 'Test',
        context: { code: ErrorCode.SYS001 },
      });
      expect(error._tag).toBe('SystemError');
      expect(error.exitCode).toBe(EXIT_FILE_ERROR);
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

    it('should format error with problem and remediation', () => {
      const error = invalidTypeError('db.port', 'integer', '"3.14"');
      const formatted = formatError(error);

      expect(formatted).toContain('Problem:');
      expect(formatted).toContain('Remediation:');
      expect(formatted).toContain('Provide a valid integer value');
    });

    it('should omit problem and remediation when absent', () => {
      const error = new ValidationError({
        message: 'Missing details',
        context: { code: ErrorCode.VAL001, problem: '', remediation: '' },
      });
      const formatted = formatError(error);

      expect(formatted).not.toContain('Problem:');
      expect(formatted).not.toContain('Remediation:');
    });

    it('should format error with available keys', () => {
      const error = keyNotFoundError('unknown.key', ['known.a', 'known.b', 'known.c']);
      const formatted = formatError(error);

      expect(formatted).toContain('Available keys:');
      expect(formatted).toContain('known.a');
      expect(formatted).toContain('known.b');
    });

    it('should truncate available keys list over 10 items', () => {
      const keys = Array.from({ length: 15 }, (_, i) => `key${i}`);
      const error = keyNotFoundError('unknown', keys);
      const formatted = formatError(error);

      expect(formatted).toContain('key0');
      expect(formatted).toContain('key9');
      expect(formatted).toContain('... and 5 more');
    });

    it('should format error without path', () => {
      const error = connectionFailedError('aws-ssm');
      const formatted = formatError(error);

      expect(formatted).toContain('Provider Error [PROV001]');
      expect(formatted).not.toContain(': undefined');
    });

    it('should format error with location', () => {
      const error = jsonnetSyntaxError('config.jsonnet:10:5', 'Unexpected token');
      const formatted = formatError(error);

      expect(formatted).toContain('Location: config.jsonnet:10:5');
    });

    it('should format error with example', () => {
      const error = formatViolationError('email', 'email', 'invalid', 'user@example.com');
      const formatted = formatError(error);

      expect(formatted).toContain('Example:');
      expect(formatted).toContain('user@example.com');
    });

    it('should format CLI error', () => {
      const error = invalidFlagError('--unknown');
      const formatted = formatError(error);

      expect(formatted).toContain('CLI Error [CLI001]');
    });

    it('should format System error', () => {
      const error = fileNotFoundError('/path/to/file');
      const formatted = formatError(error);

      expect(formatted).toContain('System Error [SYS002]');
    });

    it('should format Jsonnet error', () => {
      const error = jsonnetRuntimeError('file.jsonnet:1:1', 'Error');
      const formatted = formatError(error);

      expect(formatted).toContain('Jsonnet Error [JSON002]');
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
