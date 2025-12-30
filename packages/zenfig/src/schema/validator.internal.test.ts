/**
 * Validator Internal Branch Coverage Tests
 */
import { type TSchema, Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../errors.js';

type ValidateFn = <T>(value: unknown, schema: TSchema) => Effect.Effect<T, unknown>;
type ClearValidatorCacheFn = () => void;

type MockError = {
  readonly keyword: string;
  readonly instancePath: string;
  readonly params: Record<string, unknown>;
  readonly message?: string | undefined;
};

let mockErrors: Array<MockError> = [];

vi.mock('ajv', () => ({
  default: class AjvMock {
    compile() {
      const validateFn: ((value: unknown) => boolean) & { errors?: Array<MockError> } = () => false;
      validateFn.errors = mockErrors;
      return validateFn;
    }
  },
}));

vi.mock('ajv-formats', () => ({
  default: () => undefined,
}));

describe('validator internals', () => {
  let validate: ValidateFn;
  let clearValidatorCache: ClearValidatorCacheFn;

  beforeEach(async () => {
    mockErrors = [];
    vi.resetModules();
    const mod = await import('./validator.js');
    validate = mod.validate;
    clearValidatorCache = mod.clearValidatorCache;
    clearValidatorCache();
  });

  it('should provide format examples for known formats', async () => {
    const cases = [
      { format: 'uri', example: 'https://example.com/path' },
      { format: 'url', example: 'https://example.com/path' },
      { format: 'date', example: '2024-01-15' },
      { format: 'date-time', example: '2024-01-15T10:30:00Z' },
      { format: 'time', example: '10:30:00' },
      { format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
      { format: 'ipv4', example: '192.168.1.1' },
      { format: 'ipv6', example: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' },
      { format: 'hostname', example: 'example.com' },
    ];

    for (const { example, format } of cases) {
      mockErrors = [
        {
          keyword: 'format',
          instancePath: '',
          params: { format },
          message: 'invalid format',
        },
      ];

      const schema = Type.String({ format });
      const exit = await Effect.runPromiseExit(validate('bad', schema));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          const error = cause.error as { context: { code?: string; example?: string } };
          expect(error.context.code).toBe(ErrorCode.VAL002);
          expect(error.context.example).toBe(example);
        }
      }
    }
  });

  it('should return undefined example for unknown formats', async () => {
    mockErrors = [
      {
        keyword: 'format',
        instancePath: '',
        params: { format: 'custom-format' },
        message: 'invalid format',
      },
    ];

    const schema = Type.String({ format: 'custom-format' });
    const exit = await Effect.runPromiseExit(validate('bad', schema));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure') {
      const cause = exit.cause;
      if (cause._tag === 'Fail') {
        const error = cause.error as { context: { example?: string } };
        expect(error.context.example).toBeUndefined();
      }
    }
  });

  it('should handle null values when resolving error paths', async () => {
    mockErrors = [
      {
        keyword: 'type',
        instancePath: '/a/b',
        params: { type: 'string' },
        message: 'invalid type',
      },
    ];

    const schema = Type.Object({ a: Type.Object({ b: Type.String() }) });
    const exit = await Effect.runPromiseExit(validate({ a: null }, schema));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure') {
      const cause = exit.cause;
      if (cause._tag === 'Fail') {
        const error = cause.error as { context: { received?: string } };
        expect(error.context.received).toContain('null');
      }
    }
  });

  it('should handle non-object values when resolving error paths', async () => {
    mockErrors = [
      {
        keyword: 'type',
        instancePath: '/a/b',
        params: { type: 'string' },
        message: 'invalid type',
      },
    ];

    const schema = Type.Object({ a: Type.Object({ b: Type.String() }) });
    const exit = await Effect.runPromiseExit(validate({ a: 'nope' }, schema));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure') {
      const cause = exit.cause;
      if (cause._tag === 'Fail') {
        const error = cause.error as { context: { received?: string } };
        expect(error.context.received).toBe('undefined');
      }
    }
  });

  it('should format enum, const, and additionalProperties errors', async () => {
    const cases = [
      {
        keyword: 'enum',
        params: { allowedValues: ['a', 'b'] },
        schema: Type.String(),
      },
      {
        keyword: 'const',
        params: { allowedValue: 'fixed' },
        schema: Type.String(),
      },
      {
        keyword: 'additionalProperties',
        params: { additionalProperty: 'extra' },
        schema: Type.Object({}),
      },
      {
        keyword: 'unknown',
        params: {},
        schema: Type.String(),
      },
    ];

    for (const { keyword, params, schema } of cases) {
      mockErrors = [
        {
          keyword,
          instancePath: '',
          params,
          message: 'invalid',
        },
      ];

      const exit = await Effect.runPromiseExit(validate('bad', schema));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          const error = cause.error as { context: { code?: string } };
          expect(error.context.code).toBe(ErrorCode.VAL003);
        }
      }
    }
  });
});
