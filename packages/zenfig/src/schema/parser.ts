/**
 * Schema-Directed Value Parser
 *
 * Parses string values into typed values based on TypeBox schema
 * No implicit coercion - parsing is explicit and schema-driven
 */
import { Kind, type TSchema } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { invalidTypeError, type ValidationError } from '../errors.js';
import { getTypeDescription, isObjectSchema, unwrapOptional, validateKeyPathSegments } from './resolver.js';

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
function parseBoolean(value: string, path: string): Effect.Effect<boolean, ValidationError> {
  const lower = value.toLowerCase();
  if (lower === 'true') return Effect.succeed(true);
  if (lower === 'false') return Effect.succeed(false);
  return Effect.fail(invalidTypeError(path, 'boolean (true/false)', `"${value}"`));
}

/**
 * Parse a string as an integer
 * Rejects decimals, NaN, Infinity
 */
function parseInteger(value: string, path: string): Effect.Effect<number, ValidationError> {
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
}

/**
 * Parse a string as a number (float)
 * Rejects NaN, Infinity
 */
function parseNumber(value: string, path: string): Effect.Effect<number, ValidationError> {
  const num = Number(value.trim());

  if (Number.isNaN(num)) {
    return Effect.fail(invalidTypeError(path, 'number', `"${value}" (not a number)`));
  }

  if (!Number.isFinite(num)) {
    return Effect.fail(invalidTypeError(path, 'number', `"${value}" (Infinity not allowed)`));
  }

  return Effect.succeed(num);
}

/**
 * Parse a string as JSON (for arrays and objects)
 */
function parseJson(value: string, path: string, expectedType: string): Effect.Effect<unknown, ValidationError> {
  return Effect.try({
    try: () => JSON.parse(value),
    catch: () => invalidTypeError(path, expectedType, `"${value}" (invalid JSON)`),
  });
}

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
export function parseValue(
  value: string,
  schema: TSchema,
  path: string,
  mode: ParseMode = 'auto'
): Effect.Effect<ParsedValue, ValidationError> {
  // Handle mode overrides
  if (mode !== 'auto') {
    switch (mode) {
      case 'string':
        return Effect.succeed(value);
      case 'int':
        return parseInteger(value, path);
      case 'float':
        return parseNumber(value, path);
      case 'bool':
        return parseBoolean(value, path);
      case 'json':
        return parseJson(value, path, 'JSON');
    }
  }

  // Unwrap optional
  const unwrapped = unwrapOptional(schema);
  const kind = unwrapped[Kind];

  switch (kind) {
    case 'String':
      // Keep as string (no JSON parsing)
      return Effect.succeed(value);

    case 'Boolean':
      return parseBoolean(value, path);

    case 'Integer':
      return parseInteger(value, path);

    case 'Number':
      return parseNumber(value, path);

    case 'Array':
      return parseJson(value, path, getTypeDescription(unwrapped));

    case 'Object':
      return parseJson(value, path, getTypeDescription(unwrapped));

    case 'Literal': {
      // For literals, parse based on the literal type
      const literalValue = (unwrapped as TSchema & { const: unknown }).const;
      if (typeof literalValue === 'string') {
        return Effect.succeed(value);
      }
      if (typeof literalValue === 'number') {
        return parseNumber(value, path);
      }
      if (typeof literalValue === 'boolean') {
        return parseBoolean(value, path);
      }
      return Effect.succeed(value);
    }

    case 'Union': {
      // Try each branch in order, use first that validates
      const anyOf = (unwrapped as TSchema & { anyOf: Array<TSchema> }).anyOf;
      return pipe(
        Effect.reduce(anyOf, null as ParsedValue | null, (acc, branch) => {
          if (acc !== null) {
            return Effect.succeed(acc);
          }
          return pipe(
            parseValue(value, branch, path, 'auto'),
            Effect.map((parsed) => parsed as ParsedValue | null),
            Effect.catchAll(() => Effect.succeed(null))
          );
        }),
        Effect.map((result) => (result !== null ? result : value))
      );
    }

    case 'Null':
      // Null type - should only match the string "null"
      if (value.toLowerCase() === 'null') {
        return Effect.succeed(null);
      }
      return Effect.fail(invalidTypeError(path, 'null', `"${value}"`));

    default:
      // Unknown type, keep as string
      return Effect.succeed(value);
  }
}

/**
 * Serialize a typed value back to a provider string
 *
 * @param value - The typed value to serialize
 * @param schema - The TypeBox schema
 */
export function serializeValue(value: unknown, schema: TSchema): string {
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
}

/**
 * Parse a flat key-value map into a nested typed object using the schema
 *
 * @param kv - Flat map of canonical dot paths to string values
 * @param schema - The TypeBox schema
 */
export type ProviderParseResult = {
  readonly parsed: Record<string, unknown>;
  readonly unknownKeys: ReadonlyArray<string>;
};

function resolveSchemaForSegments(
  rootSchema: TSchema,
  segments: ReadonlyArray<string>
): { readonly schema: TSchema | undefined; readonly known: boolean } {
  let currentSchema = rootSchema;

  for (const segment of segments) {
    currentSchema = unwrapOptional(currentSchema);

    if (!isObjectSchema(currentSchema)) {
      return { schema: undefined, known: false };
    }

    const props = currentSchema.properties;
    const propSchema = props[segment];
    if (!propSchema) {
      return { schema: undefined, known: false };
    }

    currentSchema = propSchema as TSchema;
  }

  return { schema: currentSchema, known: true };
}

export function parseProviderKV(
  kv: Record<string, string>,
  schema: TSchema
): Effect.Effect<ProviderParseResult, ValidationError> {
  return pipe(
    Effect.forEach(Object.entries(kv), ([path, value]) =>
      pipe(
        validateKeyPathSegments(path),
        Effect.map((segments) => {
          const resolved = resolveSchemaForSegments(schema, segments);
          return { path, value, segments, resolved };
        }),
        Effect.flatMap(({ path: keyPath, resolved, segments, value }) => {
          if (!resolved.known || !resolved.schema) {
            return Effect.succeed({ segments, parsed: value, known: false, path: keyPath });
          }

          return pipe(
            parseValue(value, resolved.schema, keyPath),
            Effect.map((parsed) => ({ segments, parsed, known: true, path: keyPath }))
          );
        })
      )
    ),
    Effect.map((results) => {
      const parsed: Record<string, unknown> = {};
      const unknownKeys: Array<string> = [];

      for (const { known, parsed: value, path, segments } of results) {
        if (!known) {
          unknownKeys.push(path);
        }

        let current: Record<string, unknown> = parsed;

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i]!;
          const isLast = i === segments.length - 1;

          if (isLast) {
            current[segment] = value;
          } else {
            if (!(segment in current) || typeof current[segment] !== 'object') {
              current[segment] = {};
            }
            current = current[segment] as Record<string, unknown>;
          }
        }
      }

      return { parsed, unknownKeys };
    })
  );
}
