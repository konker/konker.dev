/**
 * Doctor Command
 *
 * Check local prerequisites and basic connectivity
 */
import chalk from 'chalk';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import { execa } from 'execa';
import * as fs from 'node:fs';

import { type ResolvedConfig } from '../config.js';
import { getProvider } from '../providers/registry.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type DoctorOptions = {
  readonly config: ResolvedConfig;
};

export type CheckResult = {
  readonly name: string;
  readonly status: 'ok' | 'warn' | 'error';
  readonly message: string;
  readonly details?: string | undefined;
};

export type DoctorResult = {
  readonly checks: ReadonlyArray<CheckResult>;
  readonly allPassed: boolean;
};

// --------------------------------------------------------------------------
// Check Functions
// --------------------------------------------------------------------------

/**
 * Check if a binary exists in PATH
 */
const checkBinary = (name: string): Effect.Effect<CheckResult, never> =>
  Effect.promise(async () => {
    try {
      await execa('which', [name]);
      const version = await execa(name, ['--version']).catch(() => ({ stdout: 'unknown' }));
      return {
        name: `Binary: ${name}`,
        status: 'ok' as const,
        message: 'Found in PATH',
        details: version.stdout.split('\n')[0],
      };
    } catch {
      return {
        name: `Binary: ${name}`,
        status: 'error' as const,
        message: 'Not found in PATH',
        details: `Install ${name} and ensure it is in your PATH`,
      };
    }
  });

/**
 * Check if a file exists and is readable
 */
const checkFile = (path: string, description: string): Effect.Effect<CheckResult, never> =>
  Effect.sync(() => {
    try {
      fs.accessSync(path, fs.constants.R_OK);
      return {
        name: `File: ${description}`,
        status: 'ok' as const,
        message: `Found: ${path}`,
      };
    } catch {
      return {
        name: `File: ${description}`,
        status: 'error' as const,
        message: `Not found: ${path}`,
        details: 'Create the file or update the path in configuration',
      };
    }
  });

/**
 * Check if schema can be loaded
 */
const checkSchema = (schemaPath: string, exportName: string): Effect.Effect<CheckResult, never> =>
  pipe(
    Effect.either(loadSchemaWithDefaults(schemaPath, exportName)),
    Effect.map((result) => {
      if (result._tag === 'Left') {
        const errorDetails = 'context' in result.left ? result.left.context.problem : 'Unknown error';
        return {
          name: 'Schema loading',
          status: 'error' as const,
          message: `Failed to load schema from ${schemaPath}`,
          details: errorDetails,
        };
      }

      return {
        name: 'Schema loading',
        status: 'ok' as const,
        message: `Successfully loaded '${exportName}' from ${schemaPath}`,
        details: `Schema hash: ${result.right.schemaHash.slice(0, 16)}...`,
      };
    })
  );

/**
 * Check provider connectivity (optional)
 */
const checkProvider = (providerName: string): Effect.Effect<CheckResult, never> =>
  pipe(
    Effect.either(getProvider(providerName)),
    Effect.map((result) => {
      if (result._tag === 'Left') {
        const errorDetails = 'context' in result.left ? result.left.context.problem : 'Unknown error';
        return {
          name: `Provider: ${providerName}`,
          status: 'error' as const,
          message: 'Provider not registered',
          details: errorDetails,
        };
      }

      return {
        name: `Provider: ${providerName}`,
        status: 'ok' as const,
        message: 'Provider registered',
        details: `Capabilities: ${JSON.stringify(result.right.capabilities)}`,
      };
    })
  );

/**
 * Print a check result
 */
const printCheck = (check: CheckResult): void => {
  const icon = check.status === 'ok' ? chalk.green('\u2713') : check.status === 'warn' ? chalk.yellow('\u26A0') : chalk.red('\u2717');

  console.log(`${icon} ${check.name}`);
  console.log(`  ${check.message}`);
  if (check.details) {
    console.log(chalk.dim(`  ${check.details}`));
  }
  console.log('');
};

// --------------------------------------------------------------------------
// Doctor Command
// --------------------------------------------------------------------------

/**
 * Execute the doctor workflow
 */
export const executeDoctor = (
  options: DoctorOptions
): Effect.Effect<DoctorResult, never> =>
  pipe(
    Effect.sync(() => {
      console.log(chalk.bold('\nZenfig Doctor\n'));
      console.log('Checking prerequisites...\n');
      return { config: options.config, checks: [] as Array<CheckResult> };
    }),
    Effect.flatMap(({ config, checks }) =>
      // 1. Check jsonnet binary
      pipe(
        checkBinary('jsonnet'),
        Effect.map((jsonnetCheck) => {
          checks.push(jsonnetCheck);
          printCheck(jsonnetCheck);
          return { config, checks };
        })
      )
    ),
    Effect.flatMap(({ config, checks }) => {
      // 2. Check chamber binary (if using chamber provider)
      if (config.provider === 'chamber') {
        return pipe(
          checkBinary('chamber'),
          Effect.map((chamberCheck) => {
            checks.push(chamberCheck);
            printCheck(chamberCheck);
            return { config, checks };
          })
        );
      }
      return Effect.succeed({ config, checks });
    }),
    Effect.flatMap(({ config, checks }) =>
      // 3. Check schema file
      pipe(
        checkFile(config.schema, 'Schema file'),
        Effect.map((schemaFileCheck) => {
          checks.push(schemaFileCheck);
          printCheck(schemaFileCheck);
          return { config, checks, schemaFileCheck };
        })
      )
    ),
    Effect.flatMap(({ config, checks, schemaFileCheck }) =>
      // 4. Check Jsonnet template file
      pipe(
        checkFile(config.jsonnet, 'Jsonnet template'),
        Effect.map((jsonnetFileCheck) => {
          checks.push(jsonnetFileCheck);
          printCheck(jsonnetFileCheck);
          return { config, checks, schemaFileCheck };
        })
      )
    ),
    Effect.flatMap(({ config, checks, schemaFileCheck }) => {
      // 5. Check schema loading
      if (schemaFileCheck.status === 'ok') {
        return pipe(
          checkSchema(config.schema, config.schemaExportName),
          Effect.map((schemaLoadCheck) => {
            checks.push(schemaLoadCheck);
            printCheck(schemaLoadCheck);
            return { config, checks };
          })
        );
      }
      return Effect.succeed({ config, checks });
    }),
    Effect.flatMap(({ config, checks }) =>
      // 6. Check provider registration
      pipe(
        checkProvider(config.provider),
        Effect.map((providerCheck) => {
          checks.push(providerCheck);
          printCheck(providerCheck);
          return checks;
        })
      )
    ),
    Effect.map((checks) => {
      // Summary
      console.log('');
      const errors = checks.filter((c) => c.status === 'error');
      const warnings = checks.filter((c) => c.status === 'warn');
      const passed = checks.filter((c) => c.status === 'ok');

      if (errors.length === 0) {
        console.log(chalk.green(`All ${passed.length} checks passed!`));
        if (warnings.length > 0) {
          console.log(chalk.yellow(`${warnings.length} warning(s)`));
        }
      } else {
        console.log(chalk.red(`${errors.length} check(s) failed`));
        console.log(chalk.yellow(`${warnings.length} warning(s)`));
        console.log(chalk.green(`${passed.length} check(s) passed`));
      }

      return {
        checks,
        allPassed: errors.length === 0,
      };
    })
  );

/**
 * Run doctor command
 */
export const runDoctor = (
  options: DoctorOptions
): Effect.Effect<boolean, never> =>
  pipe(
    executeDoctor(options),
    Effect.map((result) => result.allPassed)
  );
