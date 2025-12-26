/**
 * Schema-Directed Value Parser
 *
 * Parses string values into typed values based on TypeBox schema
 * No implicit coercion - parsing is explicit and schema-driven
 */
import { Kind, type TSchema } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';

import { invalidTypeError, type ValidationError } from '../errors.js';
import { getTypeDescription, isOptionalSchema, unwrapOptional } from './resolver.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ParsedValue = unknown;

export type ParseMode = 'auto' | 'string' | 'int' | 'float' | 'bool' | 'json';

// --------------------------------------------------------------------------
// Parsing Functions
// --------------------------------------------------------------------------

/**
 * Parse a string as a boolean
 * Accepts: "true", "false" (case-insensitive)
 */
const parseBoolean = (value: string, path: string): Effect.Effect<boolean, ValidationError> => {
  const lower = value.toLowerCase();
  if (lower === 'true') return Effect.succeed(true);
  if (lower === 'false') return Effect.succeed(false);
  return Effect.fail(invalidTypeError(path, 'boolean (true/false)', `"${value}"`));
};

/**
 * Parse a string as an integer
 * Rejects decimals, NaN, Infinity
 */
const parseInteger = (value: string, path: string): Effect.Effect<number, ValidationError> => {
  const trimmed = value.trim();

  // Check for decimal point
  if (trimmed.includes('.')) {
    return Effect.fail(invalidTypeError(path, 'integer', `"${value}" (contains decimal)`));
  }

  const num = Number(trimmed);

  if (Number.isNaN(num)) {
    return Effect.fail(invalidTypeError(path, 'integer', `"${value}" (not a number)`));
  }

  if (!Number.isFinite(num)) {
    return Effect.fail(invalidTypeError(path, 'integer', `"${value}" (Infinity not allowed)`));
  }

  if (!Number.isInteger(num)) {
    return Effect.fail(invalidTypeError(path, 'integer', `"${value}" (not an integer)`));
  }

  return Effect.succeed(num);
};

/**
 * Parse a string as a number (float)
 * Rejects NaN, Infinity
 */
const parseNumber = (value: string, path: string): Effect.Effect<number, ValidationError> => {
  const num = Number(value.trim());

  if (Number.isNaN(num)) {
    return Effect.fail(invalidTypeError(path, 'number', `"${value}" (not a number)`));
  }

  if (!Number.isFinite(num)) {
    return Effect.fail(invalidTypeError(path, 'number', `"${value}" (Infinity not allowed)`));
  }

  return Effect.succeed(num);
};

/**
 * Parse a string as JSON (for arrays and objects)
 */
const parseJson = (value: string, path: string, expectedType: string): Effect.Effect<unknown, ValidationError> =>
  Effect.try({
    try: () => JSON.parse(value),
    catch: () => invalidTypeError(path, expectedType, `"${value}" (invalid JSON)`),
  });

// --------------------------------------------------------------------------
// Schema-Directed Parsing
// --------------------------------------------------------------------------

/**
 * Parse a string value according to the schema type
 *
 * @param value - The string value to parse
 * @param schema - The TypeBox schema defining the expected type
 * @param path - The key path (for error messages)
 * @param mode - Optional parse mode override
 */
export const parseValue = (
  value: string,
  schema: TSchema,
  path: string,
  mode: ParseMode = 'auto'
): Effect.Effect<ParsedValue, ValidationError> =>
  Effect.gen(function* () {
    // Handle mode overrides
    if (mode !== 'auto') {
      switch (mode) {
        case 'string':
          return value;
        case 'int':
          return yield* parseInteger(value, path);
        case 'float':
          return yield* parseNumber(value, path);
        case 'bool':
          return yield* parseBoolean(value, path);
        case 'json':
          return yield* parseJson(value, path, 'JSON');
      }
    }

    // Unwrap optional
    const unwrapped = unwrapOptional(schema);
    const kind = unwrapped[Kind];

    switch (kind) {
      case 'String':
        // Keep as string (no JSON parsing)
        return value;

      case 'Boolean':
        return yield* parseBoolean(value, path);

      case 'Integer':
        return yield* parseInteger(value, path);

      case 'Number':
        return yield* parseNumber(value, path);

      case 'Array':
        return yield* parseJson(value, path, getTypeDescription(unwrapped));

      case 'Object':
        return yield* parseJson(value, path, getTypeDescription(unwrapped));

      case 'Literal': {
        // For literals, parse based on the literal type
        const literalValue = (unwrapped as TSchema & { const: unknown }).const;
        if (typeof literalValue === 'string') {
          return value;
        }
        if (typeof literalValue === 'number') {
          return yield* parseNumber(value, path);
        }
        if (typeof literalValue === 'boolean') {
          return yield* parseBoolean(value, path);
        }
        return value;
      }

      case 'Union': {
        // Try each branch in order, use first that validates
        const anyOf = (unwrapped as TSchema & { anyOf: Array<TSchema> }).anyOf;
        for (const branch of anyOf) {
          const result = yield* Effect.either(parseValue(value, branch, path, 'auto'));
          if (result._tag === 'Right') {
            return result.right;
          }
        }
        // None matched, return the string and let validation catch it
        return value;
      }

      case 'Null':
        // Null type - should only match the string "null"
        if (value.toLowerCase() === 'null') {
          return null;
        }
        return yield* Effect.fail(invalidTypeError(path, 'null', `"${value}"`));

      default:
        // Unknown type, keep as string
        return value;
    }
  });

/**
 * Serialize a typed value back to a provider string
 *
 * @param value - The typed value to serialize
 * @param schema - The TypeBox schema
 */
export const serializeValue = (value: unknown, schema: TSchema): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const unwrapped = unwrapOptional(schema);
  const kind = unwrapped[Kind];

  switch (kind) {
    case 'String':
      return String(value);

    case 'Boolean':
      return value ? 'true' : 'false';

    case 'Integer':
    case 'Number':
      return String(value);

    case 'Array':
    case 'Object':
      return JSON.stringify(value);

    default:
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
};

/**
 * Parse a flat key-value map into a nested typed object using the schema
 *
 * @param kv - Flat map of canonical dot paths to string values
 * @param schema - The TypeBox schema
 */
export const parseProviderKV = (
  kv: Record<string, string>,
  schema: TSchema
): Effect.Effect<Record<string, unknown>, ValidationError> =>
  Effect.gen(function* () {
    const result: Record<string, unknown> = {};

    for (const [path, value] of Object.entries(kv)) {
      // Split path and build nested structure
      const segments = path.split('.');
      let current: Record<string, unknown> = result;
      let currentSchema = schema;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]!;
        const isLast = i === segments.length - 1;

        // Navigate schema
        if (currentSchema[Kind] === 'Object' && 'properties' in currentSchema) {
          const props = (currentSchema as TSchema & { properties: Record<string, TSchema> }).properties;
          const propSchema = props[segment];
          if (propSchema) {
            currentSchema = propSchema;
          }
        }

        if (isLast) {
          // Parse and set the value
          const parsed = yield* parseValue(value, currentSchema, path);
          current[segment] = parsed;
        } else {
          // Create intermediate object if needed
          if (!(segment in current) || typeof current[segment] !== 'object') {
            current[segment] = {};
          }
          current = current[segment] as Record<string, unknown>;

          // Unwrap optional for navigation
          if (isOptionalSchema(currentSchema)) {
            currentSchema = unwrapOptional(currentSchema);
          }
        }
      }
    }

    return result;
  });
