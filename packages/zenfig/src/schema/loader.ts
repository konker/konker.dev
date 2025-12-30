/**
 * Schema Loader
 *
 * Dynamically loads validation schemas from TypeScript files
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { fileNotFoundError, type SystemError, type ValidationError, type ZenfigError } from '../errors.js';
import { getValidatorAdapter, type ValidationKind, type ValidatorAdapter } from '../validation/index.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type SchemaLoadResult = {
  readonly schema: unknown;
  readonly schemaHash: string;
  readonly adapter: ValidatorAdapter;
  readonly validation: ValidationKind;
};

// --------------------------------------------------------------------------
// Schema Loading
// --------------------------------------------------------------------------

/**
 * Check if a file exists and is readable
 */
function fileExists(filePath: string): Effect.Effect<boolean, never> {
  return Effect.sync(() => {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Load a schema from a TypeScript file
 *
 * @param schemaPath - Path to the schema file
 * @param validation - Validation layer (effect | zod)
 */
export function loadSchema(
  schemaPath: string,
  validation: ValidationKind
): Effect.Effect<SchemaLoadResult, SystemError | ValidationError | ZenfigError> {
  const adapter = getValidatorAdapter(validation);

  return pipe(
    Effect.sync(() => path.resolve(schemaPath)),
    Effect.flatMap((absolutePath) =>
      pipe(
        fileExists(absolutePath),
        Effect.flatMap((exists) => {
          if (!exists) {
            return Effect.fail(fileNotFoundError(absolutePath));
          }

          const fileUrl = pathToFileURL(absolutePath).href;

          return pipe(
            Effect.tryPromise({
              try: () => import(fileUrl),
              catch: () => fileNotFoundError(absolutePath),
            }),
            Effect.flatMap((module: Record<string, unknown>) => {
              const schema = module.ConfigSchema;
              if (!schema) {
                const availableExports = Object.keys(module).filter((k) => k !== 'default' && k !== '__esModule');
                return Effect.fail(
                  fileNotFoundError(
                    `Export 'ConfigSchema' not found in ${absolutePath}. Available exports: ${availableExports.join(', ')}`
                  )
                );
              }

              if (!adapter.isSchema(schema)) {
                return Effect.fail(fileNotFoundError(`Export 'ConfigSchema' is not a valid ${adapter.name} schema`));
              }

              const schemaHash = adapter.computeSchemaHash(schema);

              return Effect.succeed({ schema, schemaHash, adapter, validation });
            })
          );
        })
      )
    )
  );
}

/**
 * Load schema with fallback to default path
 */
export function loadSchemaWithDefaults(
  schemaPath?: string,
  validation?: ValidationKind
): Effect.Effect<SchemaLoadResult, SystemError | ValidationError | ZenfigError> {
  const resolvedPath = schemaPath ?? 'src/schema.ts';
  const resolvedValidation = validation ?? 'effect';
  return loadSchema(resolvedPath, resolvedValidation);
}
