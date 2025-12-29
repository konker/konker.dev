/**
 * Schema Path Resolver
 *
 * Resolves dot-notation key paths to TypeBox schema nodes
 * Matches schema property names case-sensitively
 */
import { Kind, type TObject, type TSchema } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { invalidKeyPathError, keyNotFoundError, type ValidationError } from '../errors.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ResolvedPath = {
  readonly canonicalPath: string; // The path with correct casing from schema
  readonly schema: TSchema; // The TypeBox schema node at this path
  readonly segments: ReadonlyArray<string>; // Path segments with canonical casing
};

export type SchemaKeyInfo = {
  readonly path: string;
  readonly schema: TSchema;
  readonly isOptional: boolean;
  readonly hasDefault: boolean;
  readonly defaultValue?: unknown;
};

// --------------------------------------------------------------------------
// Key Path Rules
// --------------------------------------------------------------------------

export const KEY_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/;

export function validateKeyPathSegments(keyPath: string): Effect.Effect<ReadonlyArray<string>, ValidationError> {
  return Effect.suspend(() => {
    if (!keyPath || keyPath.trim() === '') {
      return Effect.fail(keyNotFoundError('(empty path)'));
    }

    const segments = keyPath.split('.');
    const invalid = segments.find((segment) => !KEY_SEGMENT_PATTERN.test(segment));
    if (invalid) {
      return Effect.fail(invalidKeyPathError(keyPath, `Invalid key segment '${invalid}'`));
    }

    return Effect.succeed(segments);
  });
}

// --------------------------------------------------------------------------
// Type Guards
// --------------------------------------------------------------------------

/**
 * Check if schema is a TypeBox object schema
 */
export function isObjectSchema(schema: TSchema): schema is TObject {
  return schema[Kind] === 'Object' && 'properties' in schema;
}

/**
 * Check if schema is an optional type
 */
export function isOptionalSchema(schema: TSchema): boolean {
  return schema[Kind] === 'Optional';
}

/**
 * Get the inner schema from optional wrapper
 */
export function unwrapOptional(schema: TSchema): TSchema {
  if (isOptionalSchema(schema) && 'anyOf' in schema) {
    const anyOf = (schema as any).anyOf as Array<TSchema>;
    // Find the non-undefined type
    const nonUndefined = anyOf.find((s) => s[Kind] !== 'Undefined');
    return nonUndefined ?? schema;
  }
  return schema;
}

// --------------------------------------------------------------------------
// Path Resolution
// --------------------------------------------------------------------------

/**
 * Find a property in an object schema (case-sensitive)
 * Returns the canonical property name and schema, or undefined
 */
function findProperty(
  objectSchema: TObject,
  segment: string
): { readonly propertyName: string; readonly schema: TSchema } | undefined {
  const properties = objectSchema.properties;

  for (const [propName, propSchema] of Object.entries(properties)) {
    if (propName === segment) {
      return { propertyName: propName, schema: propSchema as TSchema };
    }
  }

  return undefined;
}

/**
 * Resolve a dot-notation path to a schema node
 *
 * @param schema - The root TypeBox schema (must be an object)
 * @param keyPath - Dot-notation path (e.g., "database.url")
 * @returns Resolved path with canonical casing and schema node
 */
export function resolvePath(schema: TSchema, keyPath: string): Effect.Effect<ResolvedPath, ValidationError> {
  return pipe(
    validateKeyPathSegments(keyPath),
    Effect.flatMap((segments) => {
      const canonicalSegments: Array<string> = [];
      let currentSchema = schema;

      for (const segment of segments) {
        // Unwrap optional if present
        currentSchema = unwrapOptional(currentSchema);

        if (!isObjectSchema(currentSchema)) {
          const partialPath = canonicalSegments.join('.');
          return Effect.fail(keyNotFoundError(keyPath, partialPath ? [`${partialPath} is not an object`] : undefined));
        }

        const found = findProperty(currentSchema, segment);
        if (!found) {
          const availableKeys = Object.keys(currentSchema.properties).map((k) =>
            canonicalSegments.length > 0 ? `${canonicalSegments.join('.')}.${k}` : k
          );
          return Effect.fail(keyNotFoundError(keyPath, availableKeys));
        }

        canonicalSegments.push(found.propertyName);
        currentSchema = found.schema;
      }

      return Effect.succeed({
        canonicalPath: canonicalSegments.join('.'),
        schema: currentSchema,
        segments: canonicalSegments,
      });
    })
  );
}

/**
 * Canonicalize a key path using the schema
 * Returns the path with correct casing from schema
 */
export function canonicalizePath(schema: TSchema, keyPath: string): Effect.Effect<string, ValidationError> {
  return pipe(
    resolvePath(schema, keyPath),
    Effect.map((result) => result.canonicalPath)
  );
}

// --------------------------------------------------------------------------
// Schema Enumeration
// --------------------------------------------------------------------------

/**
 * Get all leaf paths in a schema
 * Returns paths to all non-object terminal nodes
 */
export function getAllLeafPaths(schema: TSchema, prefix = ''): ReadonlyArray<SchemaKeyInfo> {
  const unwrapped = unwrapOptional(schema);

  if (!isObjectSchema(unwrapped)) {
    // This is a leaf node
    return [
      {
        path: prefix,
        schema: unwrapped,
        isOptional: isOptionalSchema(schema),
        hasDefault: 'default' in unwrapped,
        defaultValue: 'default' in unwrapped ? (unwrapped as TSchema & { default: unknown }).default : undefined,
      },
    ];
  }

  // Recurse into object properties
  const results: Array<SchemaKeyInfo> = [];
  for (const [propName, propSchema] of Object.entries(unwrapped.properties)) {
    const propPath = prefix ? `${prefix}.${propName}` : propName;
    const propUnwrapped = unwrapOptional(propSchema as TSchema);

    if (isObjectSchema(propUnwrapped)) {
      // Recurse
      results.push(...getAllLeafPaths(propSchema as TSchema, propPath));
    } else {
      // Leaf
      results.push({
        path: propPath,
        schema: propUnwrapped,
        isOptional: isOptionalSchema(propSchema as TSchema),
        hasDefault: 'default' in propUnwrapped,
        defaultValue:
          'default' in propUnwrapped ? (propUnwrapped as TSchema & { default: unknown }).default : undefined,
      });
    }
  }

  return results;
}

/**
 * Get human-readable type description from schema
 */
export function getTypeDescription(schema: TSchema): string {
  const kind = schema[Kind];

  switch (kind) {
    case 'String': {
      const format = 'format' in schema ? ` (${schema.format as string} format)` : '';
      return `string${format}`;
    }
    case 'Number':
      return 'number';
    case 'Integer': {
      const constraints: Array<string> = [];
      if ('minimum' in schema) constraints.push(`minimum: ${schema.minimum as number}`);
      if ('maximum' in schema) constraints.push(`maximum: ${schema.maximum as number}`);
      return constraints.length > 0 ? `integer (${constraints.join(', ')})` : 'integer';
    }
    case 'Boolean':
      return 'boolean';
    case 'Array':
      return 'array';
    case 'Object':
      return 'object';
    case 'Null':
      return 'null';
    case 'Literal':
      return `literal ${JSON.stringify((schema as TSchema & { const: unknown }).const)}`;
    case 'Union':
      return 'union';
    case 'Optional':
      return `optional ${getTypeDescription(unwrapOptional(schema))}`;
    default:
      return kind ?? 'unknown';
  }
}
