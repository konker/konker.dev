/**
 * Validate Command
 *
 * Workflow: Input -> Parse -> Validate -> Report
 */
import * as fs from 'node:fs';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ResolvedConfig } from '../config.js';
import {
  fileNotFoundError,
  formatError,
  type SystemError,
  unknownKeysError,
  type ValidationError,
  type ZenfigError,
} from '../errors.js';
import { flatten, pathToEnvKey } from '../lib/flatten.js';
import { detectFormat, parseEnvContent } from '../lib/format.js';
import { validateAll } from '../schema/index.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { parseProviderKV } from '../schema/parser.js';
import { getAllLeafPaths, validateKeyPathSegments } from '../schema/resolver.js';
import type { ValidatorAdapter } from '../validation/types.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ValidateOptions = {
  readonly file: string;
  readonly format?: 'env' | 'json' | undefined; // Auto-detect if not specified
  readonly config: ResolvedConfig;
};

export type ValidateResult = {
  readonly valid: boolean;
  readonly errors: ReadonlyArray<ValidationError>;
  readonly parsed: Record<string, unknown>;
  readonly warnings: ReadonlyArray<string>;
};

// --------------------------------------------------------------------------
// Validate Command
// --------------------------------------------------------------------------

/**
 * Execute the validate workflow
 */
export function executeValidate(
  options: ValidateOptions
): Effect.Effect<ValidateResult, SystemError | ValidationError | ZenfigError> {
  return pipe(
    Effect.sync(() => {
      // 1. Check file exists
      if (!fs.existsSync(options.file)) {
        return { exists: false as const, content: '' };
      }
      return { exists: true as const, content: '' };
    }),
    Effect.flatMap(({ exists }) => {
      if (!exists) {
        return Effect.fail(fileNotFoundError(options.file));
      }

      // 2. Read file content
      return Effect.try({
        try: () => fs.readFileSync(options.file, 'utf-8'),
        catch: () => fileNotFoundError(options.file),
      });
    }),
    Effect.flatMap((content) => {
      // 3. Detect or use specified format
      const format = options.format ?? detectFormat(content);
      if (format === 'unknown') {
        return Effect.fail(fileNotFoundError(`Unable to detect format of ${options.file}`));
      }

      return pipe(
        loadSchemaWithDefaults(options.config.schema, options.config.validation),
        Effect.flatMap(({ adapter, schema }) => {
          if (format === 'json') {
            return pipe(
              Effect.try({
                try: () => JSON.parse(content) as Record<string, unknown>,
                catch: () => fileNotFoundError(`Invalid JSON in ${options.file}`),
              }),
              Effect.flatMap((parsed) =>
                pipe(
                  collectUnknownKeys(parsed, schema, adapter),
                  Effect.flatMap((unknownKeys) => {
                    if (unknownKeys.length > 0 && options.config.strict) {
                      return Effect.fail(unknownKeysError(unknownKeys));
                    }

                    const warnings =
                      unknownKeys.length > 0 ? [`Unknown keys in ${options.file}: ${unknownKeys.join(', ')}`] : [];

                    return pipe(
                      validateAll(parsed, schema, adapter),
                      Effect.map((result) => ({
                        valid: result.errors.length === 0,
                        errors: result.errors,
                        parsed: result.value as Record<string, unknown>,
                        warnings,
                      }))
                    );
                  })
                )
              )
            );
          }

          const envMap = parseEnvContent(content);
          const envKeyMap = buildEnvKeyMap(schema, adapter, options.config.separator);
          const unknownEnvKeys = Object.keys(envMap).filter((key) => !envKeyMap.has(key));

          if (unknownEnvKeys.length > 0 && options.config.strict) {
            return Effect.fail(unknownKeysError(unknownEnvKeys));
          }

          const warnings =
            unknownEnvKeys.length > 0 ? [`Unknown keys in ${options.file}: ${unknownEnvKeys.join(', ')}`] : [];

          const kv: Record<string, string> = {};
          for (const [envKey, value] of Object.entries(envMap)) {
            const path = envKeyMap.get(envKey);
            if (!path) {
              continue;
            }
            kv[path] = value;
          }

          return pipe(
            parseProviderKV(kv, schema, adapter),
            Effect.flatMap((parsedResult) => {
              if (parsedResult.unknownKeys.length > 0 && options.config.strict) {
                return Effect.fail(unknownKeysError(parsedResult.unknownKeys));
              }

              const combinedWarnings =
                parsedResult.unknownKeys.length > 0
                  ? warnings.concat(`Unknown keys in ${options.file}: ${parsedResult.unknownKeys.join(', ')}`)
                  : warnings;

              return pipe(
                validateAll(parsedResult.parsed, schema, adapter),
                Effect.map((result) => ({
                  valid: result.errors.length === 0,
                  errors: result.errors,
                  parsed: result.value as Record<string, unknown>,
                  warnings: combinedWarnings,
                }))
              );
            })
          );
        })
      );
    })
  );
}

/**
 * Run validate and print results
 */
export function runValidate(
  options: ValidateOptions
): Effect.Effect<boolean, SystemError | ValidationError | ZenfigError> {
  return pipe(
    executeValidate(options),
    Effect.map((result) => {
      for (const warning of result.warnings) {
        console.error(`[zenfig] Warning: ${warning}`);
      }

      if (result.valid) {
        console.log(`Validation passed: ${options.file}`);
        return true;
      }

      console.error(`Validation failed: ${options.file}`);
      console.error('');

      for (const error of result.errors) {
        console.error(formatError(error));
        console.error('');
      }

      return false;
    })
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function buildEnvKeyMap(schema: unknown, adapter: ValidatorAdapter, separator: string): Map<string, string> {
  const envKeyMap = new Map<string, string>();
  const leafPaths = getAllLeafPaths(schema as never, adapter)
    .map((entry) => entry.path)
    .filter((path) => path.length > 0);

  for (const path of leafPaths) {
    envKeyMap.set(pathToEnvKey(path, separator), path);
  }

  return envKeyMap;
}

function collectUnknownKeys(
  parsed: Record<string, unknown>,
  schema: unknown,
  adapter: ValidatorAdapter
): Effect.Effect<ReadonlyArray<string>, ValidationError> {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return Effect.succeed([]);
  }

  const leafPaths = getAllLeafPaths(schema as never, adapter).map((entry) => entry.path);
  const knownPaths = new Set(leafPaths.filter((path) => path.length > 0));
  const flat = flatten(parsed as Record<string, unknown>);

  return pipe(
    Effect.forEach(Object.keys(flat), (key) => validateKeyPathSegments(key)),
    Effect.map(() => Object.keys(flat).filter((key) => !knownPaths.has(key)))
  );
}
