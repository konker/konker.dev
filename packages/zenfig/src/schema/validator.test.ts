/**
 * Schema Validator Tests
 */
import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { afterEach, describe, expect, it } from 'vitest';

import { ErrorCode } from '../errors.js';
import { clearValidatorCache, validate, validateAll, validateAtPath } from './validator.js';

describe('Schema Validator', () => {
  afterEach(() => {
    clearValidatorCache();
  });

  describe('validate', () => {
    describe('type validation', () => {
      it('should validate string', async () => {
        const schema = Type.String();
        const result = await Effect.runPromise(validate('hello', schema));
        expect(result).toBe('hello');
      });

      it('should validate number', async () => {
        const schema = Type.Number();
        const result = await Effect.runPromise(validate(42, schema));
        expect(result).toBe(42);
      });

      it('should validate integer', async () => {
        const schema = Type.Integer();
        const result = await Effect.runPromise(validate(42, schema));
        expect(result).toBe(42);
      });

      it('should validate boolean', async () => {
        const schema = Type.Boolean();
        const result = await Effect.runPromise(validate(true, schema));
        expect(result).toBe(true);
      });

      it('should validate object', async () => {
        const schema = Type.Object({ name: Type.String() });
        const result = await Effect.runPromise(validate({ name: 'test' }, schema));
        expect(result).toEqual({ name: 'test' });
      });

      it('should validate array', async () => {
        const schema = Type.Array(Type.String());
        const result = await Effect.runPromise(validate(['a', 'b'], schema));
        expect(result).toEqual(['a', 'b']);
      });

      it('should fail for invalid type', async () => {
        const schema = Type.String();
        const exit = await Effect.runPromiseExit(validate(123, schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL001);
          }
        }
      });
    });

    describe('null handling', () => {
      it('should fail for null when not allowed', async () => {
        const schema = Type.String();
        const exit = await Effect.runPromiseExit(validate(null, schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL005);
          }
        }
      });

      it('should allow null in union with Null', async () => {
        const schema = Type.Union([Type.Null(), Type.String()]);
        const result = await Effect.runPromise(validate(null, schema));
        expect(result).toBe(null);
      });
    });

    describe('format validation', () => {
      it('should validate email format', async () => {
        const schema = Type.String({ format: 'email' });
        const result = await Effect.runPromise(validate('user@example.com', schema));
        expect(result).toBe('user@example.com');
      });

      it('should fail for invalid email', async () => {
        const schema = Type.String({ format: 'email' });
        const exit = await Effect.runPromiseExit(validate('not-an-email', schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL002);
          }
        }
      });

      it('should validate URI format', async () => {
        const schema = Type.String({ format: 'uri' });
        const result = await Effect.runPromise(validate('https://example.com/path', schema));
        expect(result).toBe('https://example.com/path');
      });

      it('should validate UUID format', async () => {
        const schema = Type.String({ format: 'uuid' });
        const result = await Effect.runPromise(validate('550e8400-e29b-41d4-a716-446655440000', schema));
        expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
      });

      it('should validate date format', async () => {
        const schema = Type.String({ format: 'date' });
        const result = await Effect.runPromise(validate('2024-01-15', schema));
        expect(result).toBe('2024-01-15');
      });

      it('should validate date-time format', async () => {
        const schema = Type.String({ format: 'date-time' });
        const result = await Effect.runPromise(validate('2024-01-15T10:30:00Z', schema));
        expect(result).toBe('2024-01-15T10:30:00Z');
      });

      it('should validate IPv4 format', async () => {
        const schema = Type.String({ format: 'ipv4' });
        const result = await Effect.runPromise(validate('192.168.1.1', schema));
        expect(result).toBe('192.168.1.1');
      });
    });

    describe('constraint validation', () => {
      it('should validate minimum', async () => {
        const schema = Type.Number({ minimum: 0 });
        const exit = await Effect.runPromiseExit(validate(-1, schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL003);
          }
        }
      });

      it('should validate maximum', async () => {
        const schema = Type.Number({ maximum: 100 });
        const exit = await Effect.runPromiseExit(validate(101, schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL003);
          }
        }
      });

      it('should validate minLength', async () => {
        const schema = Type.String({ minLength: 3 });
        const exit = await Effect.runPromiseExit(validate('ab', schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL003);
          }
        }
      });

      it('should validate maxLength', async () => {
        const schema = Type.String({ maxLength: 5 });
        const exit = await Effect.runPromiseExit(validate('toolong', schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL003);
          }
        }
      });

      it('should validate pattern', async () => {
        const schema = Type.String({ pattern: '^[a-z]+$' });
        const exit = await Effect.runPromiseExit(validate('ABC123', schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL003);
          }
        }
      });

      it('should validate enum', async () => {
        const schema = Type.Union([Type.Literal('a'), Type.Literal('b'), Type.Literal('c')]);
        const exit = await Effect.runPromiseExit(validate('d', schema));

        expect(exit._tag).toBe('Failure');
      });

      it('should validate required properties', async () => {
        const schema = Type.Object({
          required: Type.String(),
        });
        const exit = await Effect.runPromiseExit(validate({}, schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL003);
            expect(cause.error.context.path).toBe('required');
          }
        }
      });

      it('should reject additional properties when disallowed', async () => {
        const schema = Type.Object(
          {
            key: Type.String(),
          },
          { additionalProperties: false }
        );

        const exit = await Effect.runPromiseExit(validate({ key: 'value', extra: 'nope' }, schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.VAL003);
            expect(cause.error.context.path).toBe('extra');
          }
        }
      });
    });

    describe('nested object validation', () => {
      it('should validate nested objects', async () => {
        const schema = Type.Object({
          database: Type.Object({
            host: Type.String(),
            port: Type.Integer(),
          }),
        });

        const result = await Effect.runPromise(validate({ database: { host: 'localhost', port: 5432 } }, schema));

        expect(result).toEqual({ database: { host: 'localhost', port: 5432 } });
      });

      it('should report path for nested errors', async () => {
        const schema = Type.Object({
          database: Type.Object({
            port: Type.Integer(),
          }),
        });

        const exit = await Effect.runPromiseExit(validate({ database: { port: 'not a number' } }, schema));

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.path).toBe('database.port');
          }
        }
      });
    });
  });

  describe('validateAtPath', () => {
    it('should validate value at specific path', async () => {
      const schema = Type.Object({
        database: Type.Object({
          port: Type.Integer({ minimum: 1, maximum: 65535 }),
        }),
      });

      const result = await Effect.runPromise(validateAtPath(5432, schema, 'database.port'));

      expect(result).toBe(5432);
    });

    it('should fail for invalid value at path', async () => {
      const schema = Type.Object({
        database: Type.Object({
          port: Type.Integer({ minimum: 1 }),
        }),
      });

      const exit = await Effect.runPromiseExit(validateAtPath(-1, schema, 'database.port'));

      expect(exit._tag).toBe('Failure');
    });
  });

  describe('validateAll', () => {
    it('should return all errors', async () => {
      const schema = Type.Object({
        name: Type.String(),
        age: Type.Integer(),
        email: Type.String({ format: 'email' }),
      });

      const result = await Effect.runPromise(validateAll({ name: 123, age: 'not a number', email: 'invalid' }, schema));

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include required property errors', async () => {
      const schema = Type.Object({
        required: Type.String(),
      });

      const result = await Effect.runPromise(validateAll({}, schema));

      const requiredError = result.errors.find((error) => error.context.path === 'required');
      expect(requiredError?.context.code).toBe(ErrorCode.VAL003);
    });

    it('should include additionalProperties errors', async () => {
      const schema = Type.Object(
        {
          key: Type.String(),
        },
        { additionalProperties: false }
      );

      const result = await Effect.runPromise(validateAll({ key: 'value', extra: 'nope' }, schema));

      const extraError = result.errors.find((error) => error.context.path === 'extra');
      expect(extraError?.context.code).toBe(ErrorCode.VAL003);
    });

    it('should map unknown constraint errors to generic validation errors', async () => {
      const schema = Type.Array(Type.String(), { minItems: 2 });

      const result = await Effect.runPromise(validateAll([], schema));

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.context.code).toBe(ErrorCode.VAL003);
    });

    it('should return empty errors for valid data', async () => {
      const schema = Type.Object({
        name: Type.String(),
        age: Type.Integer(),
      });

      const result = await Effect.runPromise(validateAll({ name: 'John', age: 30 }, schema));

      expect(result.errors).toEqual([]);
      expect(result.value).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('clearValidatorCache', () => {
    it('should clear the Ajv cache', () => {
      // Just verify it doesn't throw
      expect(() => clearValidatorCache()).not.toThrow();
    });
  });
});
