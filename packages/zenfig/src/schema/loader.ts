/**
 * Schema Loader
 *
 * Dynamically loads TypeBox schemas from TypeScript files
 */
import { type TSchema } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { fileNotFoundError, type SystemError, type ValidationError, type ZenfigError } from '../errors.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type SchemaLoadResult = {
  readonly schema: TSchema;
  readonly schemaHash: string;
};

// --------------------------------------------------------------------------
// Schema Loading
// --------------------------------------------------------------------------

/**
 * Check if a file exists and is readable
 */
const fileExists = (filePath: string): Effect.Effect<boolean, never> =>
  Effect.sync(() => {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  });

/**
 * Compute SHA-256 hash of schema for change detection
 */
export const computeSchemaHash = (schema: TSchema): string => {
  const crypto = require('node:crypto') as typeof import('node:crypto');
  const schemaJson = JSON.stringify(schema);
  return `sha256:${crypto.createHash('sha256').update(schemaJson).digest('hex')}`;
};

/**
 * Load a TypeBox schema from a TypeScript file
 *
 * @param schemaPath - Path to the schema file
 * @param exportName - Name of the export (default: "ConfigSchema")
 */
export const loadSchema = (
  schemaPath: string,
  exportName = 'ConfigSchema'
): Effect.Effect<SchemaLoadResult, SystemError | ValidationError | ZenfigError> =>
  Effect.gen(function* () {
    const absolutePath = path.resolve(schemaPath);

    // Check file exists
    const exists = yield* fileExists(absolutePath);
    if (!exists) {
      return yield* Effect.fail(fileNotFoundError(absolutePath));
    }

    // Import the module
    // Using dynamic import with file URL for cross-platform compatibility
    const fileUrl = pathToFileURL(absolutePath).href;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const module: Record<string, unknown> = yield* Effect.tryPromise({
      try: () => import(fileUrl),
      catch: () => fileNotFoundError(absolutePath),
    });

    // Extract the schema export
    const schema = module[exportName];
    if (!schema) {
      // Find available exports for error message
      const availableExports = Object.keys(module).filter((k) => k !== 'default' && k !== '__esModule');
      return yield* Effect.fail(
        fileNotFoundError(
          `Export '${exportName}' not found in ${absolutePath}. Available exports: ${availableExports.join(', ')}`
        )
      );
    }

    // Validate it's a TypeBox schema (has Kind property)
    if (typeof schema !== 'object' || schema === null || !('type' in schema)) {
      return yield* Effect.fail(
        fileNotFoundError(`Export '${exportName}' is not a valid TypeBox schema`)
      );
    }

    const typedSchema = schema as unknown as TSchema;
    const schemaHash = computeSchemaHash(typedSchema);

    return { schema: typedSchema, schemaHash };
  });

/**
 * Load schema with fallback to default path
 */
export const loadSchemaWithDefaults = (
  schemaPath?: string,
  exportName?: string
): Effect.Effect<SchemaLoadResult, SystemError | ValidationError | ZenfigError> => {
  const resolvedPath = schemaPath ?? 'src/schema.ts';
  const resolvedExportName = exportName ?? 'ConfigSchema';
  return loadSchema(resolvedPath, resolvedExportName);
};
