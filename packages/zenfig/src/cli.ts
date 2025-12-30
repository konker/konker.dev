#!/usr/bin/env node

/**
 * Zenfig CLI
 *
 * Configuration and secrets management tool
 */
import './providers/index.js';

import { Command } from 'commander';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';

import { runDelete } from './commands/delete.js';
import { runExport } from './commands/export.js';
import { type ListFormat, runList } from './commands/list.js';
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
  Effect.runPromiseExit(effect)
    .then((exit) => {
      if (Exit.isSuccess(exit)) {
        return;
      }

      const causeOpt = Exit.causeOption(exit);
      const failure = pipe(causeOpt, Option.flatMap(Cause.failureOption), Option.getOrUndefined);

      if (failure) {
        handleError(failure);
        return;
      }

      const prettyCause = pipe(causeOpt, Option.map(Cause.pretty), Option.getOrUndefined);
      if (prettyCause) {
        console.error(prettyCause);
        process.exit(EXIT_VALIDATION_ERROR);
      }

      handleError(new Error('Unknown error'));
    })
    .catch(handleError);
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
  .option('--provider <name>', 'Provider name (default: aws-ssm)')
  .option('--env <environment>', 'Environment name')
  .option('--separator <char>', 'Env key separator (default: _)')
  .option('--strict-merge', 'Fail on type conflicts during merge')
  .option('--warn-on-override', 'Log all key overrides')
  .option('--cache <duration>', 'Cache provider fetches')
  .option('--no-cache', 'Disable cache')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--validation <effect|zod>', 'Validation layer (default: effect)')
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
  .option('--provider <name>', 'Provider name (default: aws-ssm)')
  .option('--env <environment>', 'Environment name')
  .option('--stdin', 'Read value from stdin')
  .option('--type <auto|string|int|float|bool|json>', 'How to parse input')
  .option('--skip-encryption-check', 'Skip encryption verification')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--validation <effect|zod>', 'Validation layer (default: effect)')
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
  .option('--format <env|json>', 'File format (auto-detected if not specified)')
  .option('--validation <effect|zod>', 'Validation layer (default: effect)')
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
// List Command
// --------------------------------------------------------------------------

program
  .command('list <service>')
  .description('List configuration keys for a service')
  .option('--provider <name>', 'Provider name (default: aws-ssm)')
  .option('--env <environment>', 'Environment name')
  .option('--format <keys|table|json>', 'Output format (default: keys)')
  .option('--show-values', 'Print secret values (TTY only)')
  .option('--unsafe-show-values', 'Allow printing secrets even when stdout is not a TTY')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .action(
    (service: string, options: CLIOptions & { format?: string; showValues?: boolean; unsafeShowValues?: boolean }) => {
      runEffect(
        pipe(
          resolveConfig({
            ...options,
            ci: program.opts().ci,
            strict: program.opts().strict,
          }),
          Effect.flatMap((config) =>
            runList({
              service,
              format: options.format as ListFormat | undefined,
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
// Delete Command
// --------------------------------------------------------------------------

program
  .command('delete <service> <key>')
  .description('Delete configuration value')
  .option('--provider <name>', 'Provider name (default: aws-ssm)')
  .option('--env <environment>', 'Environment name')
  .option('--confirm', 'Skip interactive confirmation')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--validation <effect|zod>', 'Validation layer (default: effect)')
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
  .option('--provider <name>', 'Provider name (default: aws-ssm)')
  .option('--env <environment>', 'Environment name')
  .option('--output <path>', 'Output path')
  .option('--encrypt', 'Encrypt snapshot at rest')
  .option('--snapshot-key-file <path>', 'Read encryption key from file')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--validation <effect|zod>', 'Validation layer (default: effect)')
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
  .option('--provider <name>', 'Provider name (default: aws-ssm)')
  .option('--dry-run', 'Show diff without applying changes')
  .option('--force-schema-mismatch', 'Allow restore despite schema hash mismatch')
  .option('--confirm', 'Skip interactive confirmation')
  .option('--show-values', 'Print secret values in diff output (TTY only)')
  .option('--unsafe-show-values', 'Allow printing secrets even when stdout is not a TTY')
  .option('--ssm-prefix <prefix>', 'SSM path prefix (default: /zenfig)')
  .option('--schema <path>', 'Schema path')
  .option('--validation <effect|zod>', 'Validation layer (default: effect)')
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
// Parse and Run
// --------------------------------------------------------------------------

program.parse();
