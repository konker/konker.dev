#!/usr/bin/env node

/* eslint-disable fp/no-unused-expression,fp/no-nil */
/**
 * Zenfig CLI
 *
 * Configuration and secrets management tool
 */
import { Command } from 'commander';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { runDelete } from './commands/delete.js';
import { runDiff } from './commands/diff.js';
import { runDoctor } from './commands/doctor.js';
import { runExport } from './commands/export.js';
import { runInit } from './commands/init.js';
import { runSnapshotRestore, runSnapshotSave } from './commands/snapshot.js';
import { runUpsert } from './commands/upsert.js';
import { runValidate } from './commands/validate.js';
import { type CLIOptions, resolveConfig } from './config.js';
import { EXIT_VALIDATION_ERROR, formatError, type ZenfigErrorLike } from './errors.js';

// --------------------------------------------------------------------------
// Error Handling
// --------------------------------------------------------------------------

const handleError = (error: unknown): never => {
  if (error && typeof error === 'object' && 'context' in error && '_tag' in error) {
    // Zenfig error
    console.error(formatError(error as ZenfigErrorLike));
    const exitCode = 'exitCode' in error ? (error.exitCode as number) : EXIT_VALIDATION_ERROR;
    process.exit(exitCode);
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    process.exit(EXIT_VALIDATION_ERROR);
  }

  console.error('Unknown error:', error);
  process.exit(EXIT_VALIDATION_ERROR);
};

const runEffect = <A>(effect: Effect.Effect<A, unknown>): void => {
  Effect.runPromise(effect).catch(handleError);
};

// --------------------------------------------------------------------------
// CLI Setup
// --------------------------------------------------------------------------

const program = new Command();

program
  .name('zenfig')
  .description('Configuration and secrets management tool')
  .version('0.0.1')
  .option('--ci', 'Disable prompts; require explicit flags like --confirm')
  .option('--strict', 'Treat warnings as errors');

// --------------------------------------------------------------------------
// Export Command
// --------------------------------------------------------------------------

program
  .command('export <service>')
  .description('Export configuration')
  .option('--source <service>', 'Additional sources (repeatable)', (val, prev: Array<string>) => [...prev, val], [])
  .option('--format <env|json>', 'Output format (default: env)')
  .option('--provider <name>', 'Provider name (default: chamber)')
  .option('--jsonnet <path>', 'Jsonnet template path (default: config.jsonnet)')
  .option('--jsonnet-timeout <ms>', 'Kill jsonnet after timeout (default: 30000)', parseInt)
  .option('--env <environment>', 'Environment name')
  .option('--separator <char>', 'Env key separator (default: _)')
  .option('--strict-merge', 'Fail on type conflicts during merge')
  .option('--warn-on-override', 'Log all key overrides')
  .option('--cache <duration>', 'Cache provider fetches')
  .option('--no-cache', 'Disable cache')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--schema-export-name <name>', 'Schema export name')
  .action(
    (
      service: string,
      options: CLIOptions & { source?: Array<string>; strictMerge?: boolean; warnOnOverride?: boolean }
    ) => {
      runEffect(
        pipe(
          resolveConfig({
            ...options,
            source: options.source,
            ci: program.opts().ci,
            strict: program.opts().strict,
          }),
          Effect.flatMap((config) =>
            runExport({
              service,
              sources: options.source,
              config,
              strictMerge: options.strictMerge,
              warnOnOverride: options.warnOnOverride,
            })
          )
        )
      );
    }
  );

// --------------------------------------------------------------------------
// Upsert Command
// --------------------------------------------------------------------------

program
  .command('upsert <service> <key> [value]')
  .description('Upsert configuration value')
  .option('--provider <name>', 'Provider name (default: chamber)')
  .option('--env <environment>', 'Environment name')
  .option('--stdin', 'Read value from stdin')
  .option('--type <auto|string|int|float|bool|json>', 'How to parse input')
  .option('--skip-encryption-check', 'Skip encryption verification')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--schema-export-name <name>', 'Schema export name')
  .action(
    (
      service: string,
      key: string,
      value: string | undefined,
      options: CLIOptions & { stdin?: boolean; type?: string; skipEncryptionCheck?: boolean }
    ) => {
      runEffect(
        pipe(
          resolveConfig({
            ...options,
            ci: program.opts().ci,
            strict: program.opts().strict,
          }),
          Effect.flatMap((config) =>
            runUpsert({
              service,
              key,
              value,
              stdin: options.stdin,
              type: options.type as 'auto' | 'string' | 'int' | 'float' | 'bool' | 'json' | undefined,
              skipEncryptionCheck: options.skipEncryptionCheck,
              config,
            })
          )
        )
      );
    }
  );

// --------------------------------------------------------------------------
// Validate Command
// --------------------------------------------------------------------------

program
  .command('validate')
  .description('Validate configuration file')
  .requiredOption('--file <path>', 'Path to JSON or .env file')
  .option('--schema <path>', 'Schema path')
  .option('--schema-export-name <name>', 'Schema export name')
  .option('--format <env|json>', 'File format (auto-detected if not specified)')
  .action((options: CLIOptions & { file: string }) => {
    runEffect(
      pipe(
        resolveConfig({
          ...options,
          ci: program.opts().ci,
          strict: program.opts().strict,
        }),
        Effect.flatMap((config) =>
          runValidate({
            file: options.file,
            format: options.format,
            config,
          })
        ),
        Effect.tap((valid) =>
          Effect.sync(() => {
            if (!valid) {
              process.exit(EXIT_VALIDATION_ERROR);
            }
          })
        )
      )
    );
  });

// --------------------------------------------------------------------------
// Diff Command
// --------------------------------------------------------------------------

program
  .command('diff <service>')
  .description('Show diff between stored values and rendered config')
  .option('--source <service>', 'Additional sources (repeatable)', (val, prev: Array<string>) => [...prev, val], [])
  .option('--format <json|table>', 'Output format (default: table)')
  .option('--provider <name>', 'Provider name (default: chamber)')
  .option('--jsonnet <path>', 'Jsonnet template path')
  .option('--jsonnet-timeout <ms>', 'Kill jsonnet after timeout', parseInt)
  .option('--env <environment>', 'Environment name')
  .option('--show-values', 'Print secret values (TTY only)')
  .option('--unsafe-show-values', 'Allow printing secrets even when stdout is not a TTY')
  .option('--cache <duration>', 'Cache provider fetches')
  .option('--no-cache', 'Disable cache')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--schema-export-name <name>', 'Schema export name')
  .action(
    (
      service: string,
      options: CLIOptions & { source?: Array<string>; showValues?: boolean; unsafeShowValues?: boolean }
    ) => {
      runEffect(
        pipe(
          resolveConfig({
            ...options,
            source: options.source,
            ci: program.opts().ci,
            strict: program.opts().strict,
          }),
          Effect.flatMap((config) =>
            runDiff({
              service,
              sources: options.source,
              config,
              format: options.format as 'json' | 'table' | undefined,
              showValues: options.showValues,
              unsafeShowValues: options.unsafeShowValues,
            })
          ),
          Effect.tap((hasChanges) =>
            Effect.sync(() => {
              if (hasChanges) {
                process.exit(EXIT_VALIDATION_ERROR);
              }
            })
          )
        )
      );
    }
  );

// --------------------------------------------------------------------------
// Delete Command
// --------------------------------------------------------------------------

program
  .command('delete <service> <key>')
  .description('Delete configuration value')
  .option('--provider <name>', 'Provider name (default: chamber)')
  .option('--env <environment>', 'Environment name')
  .option('--confirm', 'Skip interactive confirmation')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--schema-export-name <name>', 'Schema export name')
  .action((service: string, key: string, options: CLIOptions & { confirm?: boolean }) => {
    runEffect(
      pipe(
        resolveConfig({
          ...options,
          ci: program.opts().ci,
          strict: program.opts().strict,
        }),
        Effect.flatMap((config) =>
          runDelete({
            service,
            key,
            confirm: options.confirm,
            config,
          })
        )
      )
    );
  });

// --------------------------------------------------------------------------
// Snapshot Commands
// --------------------------------------------------------------------------

const snapshotCmd = program.command('snapshot').description('Snapshot management');

snapshotCmd
  .command('save <service>')
  .description('Save configuration snapshot')
  .option('--source <service>', 'Additional sources (repeatable)', (val, prev: Array<string>) => [...prev, val], [])
  .option('--provider <name>', 'Provider name (default: chamber)')
  .option('--env <environment>', 'Environment name')
  .option('--output <path>', 'Output path')
  .option('--encrypt', 'Encrypt snapshot at rest')
  .option('--snapshot-key-file <path>', 'Read encryption key from file')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--schema-export-name <name>', 'Schema export name')
  .action(
    (
      service: string,
      options: CLIOptions & { source?: Array<string>; output?: string; encrypt?: boolean; snapshotKeyFile?: string }
    ) => {
      runEffect(
        pipe(
          resolveConfig({
            ...options,
            source: options.source,
            ci: program.opts().ci,
            strict: program.opts().strict,
          }),
          Effect.flatMap((config) =>
            runSnapshotSave({
              service,
              sources: options.source,
              output: options.output,
              encrypt: options.encrypt,
              snapshotKeyFile: options.snapshotKeyFile,
              config,
            })
          )
        )
      );
    }
  );

snapshotCmd
  .command('restore <snapshot-file>')
  .description('Restore configuration from snapshot')
  .option('--provider <name>', 'Provider name (default: chamber)')
  .option('--dry-run', 'Show diff without applying changes')
  .option('--force-schema-mismatch', 'Allow restore despite schema hash mismatch')
  .option('--confirm', 'Skip interactive confirmation')
  .option('--show-values', 'Print secret values in diff output (TTY only)')
  .option('--unsafe-show-values', 'Allow printing secrets even when stdout is not a TTY')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--schema-export-name <name>', 'Schema export name')
  .action(
    (
      snapshotFile: string,
      options: CLIOptions & {
        dryRun?: boolean;
        forceSchemaMismatch?: boolean;
        confirm?: boolean;
        showValues?: boolean;
        unsafeShowValues?: boolean;
      }
    ) => {
      runEffect(
        pipe(
          resolveConfig({
            ...options,
            ci: program.opts().ci,
            strict: program.opts().strict,
          }),
          Effect.flatMap((config) =>
            runSnapshotRestore({
              snapshotFile,
              dryRun: options.dryRun,
              forceSchemaMatch: options.forceSchemaMismatch,
              confirm: options.confirm,
              showValues: options.showValues,
              unsafeShowValues: options.unsafeShowValues,
              config,
            })
          )
        )
      );
    }
  );

// --------------------------------------------------------------------------
// Init Command
// --------------------------------------------------------------------------

program
  .command('init')
  .description('Initialize Jsonnet template from schema')
  .option('--schema <path>', 'Schema path')
  .option('--schema-export-name <name>', 'Schema export name')
  .option('--output <path>', 'Output path (default: config.jsonnet)')
  .option('--force', 'Overwrite existing file')
  .option('--include-defaults', 'Include schema defaults in template')
  .action((options: CLIOptions & { output?: string; force?: boolean; includeDefaults?: boolean }) => {
    runEffect(
      pipe(
        resolveConfig({
          ...options,
          ci: program.opts().ci,
          strict: program.opts().strict,
        }),
        Effect.flatMap((config) =>
          runInit({
            output: options.output,
            force: options.force,
            includeDefaults: options.includeDefaults,
            config,
          })
        )
      )
    );
  });

// --------------------------------------------------------------------------
// Doctor Command
// --------------------------------------------------------------------------

program
  .command('doctor')
  .description('Check local prerequisites and basic connectivity')
  .option('--provider <name>', 'Provider name (default: chamber)')
  .option('--schema <path>', 'Schema path')
  .option('--schema-export-name <name>', 'Schema export name')
  .option('--jsonnet <path>', 'Jsonnet template path')
  .action((options: CLIOptions) => {
    runEffect(
      pipe(
        resolveConfig({
          ...options,
          ci: program.opts().ci,
          strict: program.opts().strict,
        }),
        Effect.flatMap((config) => runDoctor({ config })),
        Effect.tap((passed) =>
          Effect.sync(() => {
            if (!passed) {
              process.exit(EXIT_VALIDATION_ERROR);
            }
          })
        )
      )
    );
  });

// --------------------------------------------------------------------------
// Parse and Run
// --------------------------------------------------------------------------

program.parse();
