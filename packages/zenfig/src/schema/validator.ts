/**
 * Schema Validator
 *
 * TypeBox + Ajv validation with detailed error messages
 */
import Ajv from 'ajv';
import type { ErrorObject, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { Kind, type TSchema } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';

import {
  constraintViolationError,
  formatViolationError,
  invalidTypeError,
  nullNotAllowedError,
  type ValidationError,
} from '../errors.js';
import { getTypeDescription, resolvePath } from './resolver.js';

// --------------------------------------------------------------------------
// Ajv Instance
// --------------------------------------------------------------------------

// Type for Ajv instance
type AjvInstance = {
  compile: (schema: TSchema) => ValidateFunction;
};

/**
 * Create and configure Ajv instance
 * - No type coercion (strict parsing)
 * - All formats enabled
 */
const createAjv = (): AjvInstance => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
  const ajv = new (Ajv as any)({
    strict: true,
    allErrors: true,
    coerceTypes: false, // Important: no implicit coercion
    useDefaults: false, // We handle defaults in Jsonnet
    verbose: true,
  }) as AjvInstance;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
  (addFormats as any)(ajv);
  return ajv;
};

// Singleton Ajv instance (cached for performance)
let ajvInstance: AjvInstance | undefined;

const getAjv = (): AjvInstance => {
  if (!ajvInstance) {
    ajvInstance = createAjv();
  }
  return ajvInstance;
};

// --------------------------------------------------------------------------
// Error Conversion
// --------------------------------------------------------------------------

/**
 * Convert Ajv error to Zenfig ValidationError
 */
const ajvErrorToValidationError = (
  error: ErrorObject,
  schema: TSchema,
  value: unknown
): ValidationError => {
  const path = error.instancePath.replace(/^\//g, '').replace(/\//g, '.');
  const received = JSON.stringify(value).slice(0, 100);

  switch (error.keyword) {
    case 'type': {
      const expected = error.params?.type as string;
      return invalidTypeError(path || '(root)', expected, received);
    }

    case 'format': {
      const format = error.params?.format as string;
      return formatViolationError(path, `string (${format} format)`, received, getFormatExample(format));
    }

    case 'minimum':
    case 'maximum':
    case 'exclusiveMinimum':
    case 'exclusiveMaximum': {
      const limit = error.params?.limit as number;
      const comparison = error.params?.comparison as string;
      return constraintViolationError(
        path,
        `${error.keyword}: ${limit}`,
        received,
        `Value must be ${comparison} ${limit}`
      );
    }

    case 'minLength':
    case 'maxLength': {
      const limit = error.params?.limit as number;
      return constraintViolationError(
        path,
        `${error.keyword}: ${limit}`,
        received,
        `String length must be ${error.keyword === 'minLength' ? 'at least' : 'at most'} ${limit}`
      );
    }

    case 'pattern': {
      const pattern = error.params?.pattern as string;
      return constraintViolationError(path, `pattern: ${pattern}`, received, `Value must match pattern: ${pattern}`);
    }

    case 'enum': {
      const allowedValues = error.params?.allowedValues as Array<unknown>;
      return constraintViolationError(
        path,
        `enum: ${JSON.stringify(allowedValues)}`,
        received,
        `Value must be one of: ${allowedValues.map((v) => JSON.stringify(v)).join(', ')}`
      );
    }

    case 'const': {
      const allowedValue = error.params?.allowedValue as unknown;
      return constraintViolationError(
        path,
        `const: ${JSON.stringify(allowedValue)}`,
        received,
        `Value must be exactly: ${JSON.stringify(allowedValue)}`
      );
    }

    case 'required': {
      const missingProperty = error.params?.missingProperty as string;
      const fullPath = path ? `${path}.${missingProperty}` : missingProperty;
      return constraintViolationError(fullPath, 'required', 'undefined', `Missing required property: ${missingProperty}`);
    }

    case 'additionalProperties': {
      const additionalProperty = error.params?.additionalProperty as string;
      const fullPath = path ? `${path}.${additionalProperty}` : additionalProperty;
      return constraintViolationError(fullPath, 'no additional properties', received, 'Unknown property not allowed');
    }

    default:
      return constraintViolationError(
        path || '(root)',
        getTypeDescription(schema),
        received,
        error.message ?? 'Validation failed'
      );
  }
};

/**
 * Get example value for a format
 */
const getFormatExample = (format: string): string | undefined => {
  switch (format) {
    case 'uri':
    case 'url':
      return 'https://example.com/path';
    case 'email':
      return 'user@example.com';
    case 'date':
      return '2024-01-15';
    case 'date-time':
      return '2024-01-15T10:30:00Z';
    case 'time':
      return '10:30:00';
    case 'uuid':
      return '550e8400-e29b-41d4-a716-446655440000';
    case 'ipv4':
      return '192.168.1.1';
    case 'ipv6':
      return '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    case 'hostname':
      return 'example.com';
    default:
      return undefined;
  }
};

// --------------------------------------------------------------------------
// Validation Functions
// --------------------------------------------------------------------------

/**
 * Validate a value against a TypeBox schema
 *
 * @param value - The value to validate
 * @param schema - The TypeBox schema
 * @returns Effect with validated value or ValidationError
 */
export const validate = <T>(value: unknown, schema: TSchema): Effect.Effect<T, ValidationError> =>
  Effect.gen(function* () {
    const ajv = getAjv();

    // Check for null if not explicitly allowed
    if (value === null) {
      // Check if null is allowed in the schema
      const kind = schema[Kind];
      if (kind !== 'Null' && kind !== 'Union') {
        return yield* Effect.fail(nullNotAllowedError('(root)', getTypeDescription(schema)));
      }
    }

    const validateFn = ajv.compile(schema);
    const isValid = validateFn(value);

    if (!isValid && validateFn.errors) {
      // Get the most relevant error
      const error = validateFn.errors[0];
      if (error) {
        // Get the value at the error path
        const errorValue = getValueAtPath(value, error.instancePath);
        return yield* Effect.fail(ajvErrorToValidationError(error, schema, errorValue));
      }
    }

    return value as T;
  });

/**
 * Validate a value at a specific path against the resolved schema node
 *
 * @param value - The value to validate
 * @param schema - The root TypeBox schema
 * @param path - The dot-notation path
 */
export const validateAtPath = (
  value: unknown,
  schema: TSchema,
  path: string
): Effect.Effect<unknown, ValidationError> =>
  Effect.gen(function* () {
    const resolved = yield* resolvePath(schema, path);
    return yield* validate(value, resolved.schema);
  });

/**
 * Get value at a JSON path
 */
const getValueAtPath = (value: unknown, jsonPath: string): unknown => {
  if (!jsonPath || jsonPath === '') {
    return value;
  }

  const segments = jsonPath.split('/').filter((s) => s !== '');
  let current: unknown = value;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return current;
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
};

/**
 * Validate an entire configuration object
 * Returns all errors, not just the first one
 */
export const validateAll = (
  value: unknown,
  schema: TSchema
): Effect.Effect<{ readonly value: unknown; readonly errors: ReadonlyArray<ValidationError> }, never> =>
  Effect.sync(() => {
    const ajv = getAjv();
    const validateFn = ajv.compile(schema);
    const isValid = validateFn(value);

    if (isValid || !validateFn.errors) {
      return { value, errors: [] };
    }

    const errors = validateFn.errors.map((error: ErrorObject) => {
      const errorValue = getValueAtPath(value, error.instancePath);
      return ajvErrorToValidationError(error, schema, errorValue);
    });

    return { value, errors };
  });

/**
 * Clear the Ajv cache (useful for testing)
 */
export const clearValidatorCache = (): void => {
  ajvInstance = undefined;
};
