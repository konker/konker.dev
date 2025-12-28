/**
 * Validate Command
 *
 * Workflow: Input -> Parse -> Validate -> Report
 */
import * as fs from 'node:fs';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ResolvedConfig } from '../config.js';
import { fileNotFoundError, formatError, type SystemError, type ValidationError, type ZenfigError } from '../errors.js';
import { unflatten } from '../lib/flatten.js';
import { detectFormat, parseEnvContent } from '../lib/format.js';
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

      // 4. Parse content
      if (format === 'json') {
        return pipe(
          Effect.try({
            try: () => JSON.parse(content) as Record<string, unknown>,
            catch: () => fileNotFoundError(`Invalid JSON in ${options.file}`),
          }),
          Effect.map((parsed) => ({ parsed, config: options.config }))
        );
      } else {
        // Parse .env format
        const envMap = parseEnvContent(content);
        // Need to convert env keys back to dot paths and unflatten
        // This is a simplified version - full implementation would match against schema
        const parsed = unflatten(envMap);
        return Effect.succeed({ parsed, config: options.config });
      }
    }),
    Effect.flatMap(({ config, parsed }) =>
      // 5. Load schema
      pipe(
        loadSchemaWithDefaults(config.schema, config.schemaExportName),
        Effect.flatMap(({ schema }) =>
          // 6. Validate
          pipe(
            validateAll(parsed, schema),
            Effect.map((result) => ({
              valid: result.errors.length === 0,
              errors: result.errors,
              parsed: result.value as Record<string, unknown>,
            }))
          )
        )
      )
    )
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
