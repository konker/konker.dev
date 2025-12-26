/**
 * Validate Command
 *
 * Workflow: Input -> Parse -> Validate -> Report
 */
import * as Effect from 'effect/Effect';
import * as fs from 'node:fs';

import { type ResolvedConfig } from '../config.js';
import {
  fileNotFoundError,
  formatError,
  type SystemError,
  type ValidationError,
  type ZenfigError,
} from '../errors.js';
import { detectFormat, parseEnvContent } from '../lib/format.js';
import { unflatten } from '../lib/flatten.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { validateAll } from '../schema/validator.js';

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
};

// --------------------------------------------------------------------------
// Validate Command
// --------------------------------------------------------------------------

/**
 * Execute the validate workflow
 */
export const executeValidate = (
  options: ValidateOptions
): Effect.Effect<ValidateResult, SystemError | ValidationError | ZenfigError> =>
  Effect.gen(function* () {
    const { file, config } = options;

    // 1. Check file exists
    if (!fs.existsSync(file)) {
      return yield* Effect.fail(fileNotFoundError(file));
    }

    // 2. Read file content
    const content = yield* Effect.try({
      try: () => fs.readFileSync(file, 'utf-8'),
      catch: () => fileNotFoundError(file),
    });

    // 3. Detect or use specified format
    const format = options.format ?? detectFormat(content);
    if (format === 'unknown') {
      return yield* Effect.fail(fileNotFoundError(`Unable to detect format of ${file}`));
    }

    // 4. Parse content
    let parsed: Record<string, unknown>;

    if (format === 'json') {
      parsed = yield* Effect.try({
        try: () => JSON.parse(content) as Record<string, unknown>,
        catch: () => fileNotFoundError(`Invalid JSON in ${file}`),
      });
    } else {
      // Parse .env format
      const envMap = parseEnvContent(content);
      // Need to convert env keys back to dot paths and unflatten
      // This is a simplified version - full implementation would match against schema
      parsed = unflatten(envMap);
    }

    // 5. Load schema
    const { schema } = yield* loadSchemaWithDefaults(config.schema, config.schemaExportName);

    // 6. Validate
    const result = yield* validateAll(parsed, schema);

    return {
      valid: result.errors.length === 0,
      errors: result.errors,
      parsed: result.value as Record<string, unknown>,
    };
  });

/**
 * Run validate and print results
 */
export const runValidate = (
  options: ValidateOptions
): Effect.Effect<boolean, SystemError | ValidationError | ZenfigError> =>
  Effect.gen(function* () {
    const result = yield* executeValidate(options);

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
  });
