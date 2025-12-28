/**
 * Export Command
 *
 * Workflow: Fetch -> Parse -> Merge -> Inject -> Template -> Validate -> Format
 */
import { type TSchema } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ResolvedConfig } from '../config.js';
import {
  type JsonnetError,
  type ProviderError,
  type SystemError,
  type ValidationError,
  type ZenfigError,
} from '../errors.js';
import { evaluateTemplate } from '../jsonnet/executor.js';
import { formatConfig } from '../lib/format.js';
import { formatConflicts, mergeConfigs, type MergeOptions, type MergeResult } from '../lib/merge.js';
import { checkProviderGuards } from '../providers/guards.js';
import { type Provider, type ProviderContext, type ProviderKV } from '../providers/Provider.js';
import { getProvider } from '../providers/registry.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { parseProviderKV } from '../schema/parser.js';
import { validate } from '../schema/validator.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ExportOptions = {
  readonly service: string;
  readonly sources?: ReadonlyArray<string> | undefined;
  readonly config: ResolvedConfig;
  readonly warnOnOverride?: boolean | undefined;
  readonly strictMerge?: boolean | undefined;
};

export type ExportResult = {
  readonly config: Record<string, unknown>;
  readonly formatted: string;
  readonly conflicts: MergeResult<Record<string, unknown>>['conflicts'];
  readonly warnings: ReadonlyArray<string>;
};

// --------------------------------------------------------------------------
// Helper Functions
// --------------------------------------------------------------------------

/**
 * Fetch values from a provider for a single service
 */
function fetchService(provider: Provider, ctx: ProviderContext): Effect.Effect<ProviderKV, ProviderError> {
  return provider.fetch(ctx);
}

/**
 * Fetch and parse values for multiple services
 */
function fetchAllServices(
  provider: Provider,
  prefix: string,
  env: string,
  services: ReadonlyArray<string>,
  rootSchema: TSchema,
  providerGuards: ResolvedConfig['providerGuards']
): Effect.Effect<ReadonlyArray<readonly [string, Record<string, unknown>]>, ProviderError | ValidationError> {
  return Effect.forEach(services, (service) => {
    const ctx: ProviderContext = { prefix, service, env };
    return pipe(
      checkProviderGuards(provider, ctx, providerGuards),
      Effect.flatMap(() => fetchService(provider, ctx)),
      Effect.flatMap((kv) => parseProviderKV(kv, rootSchema)),
      Effect.map((parsed) => [service, parsed] as const)
    );
  });
}

// --------------------------------------------------------------------------
// Export Command
// --------------------------------------------------------------------------

/**
 * Execute the export workflow
 */
export function executeExport(
  options: ExportOptions
): Effect.Effect<ExportResult, ProviderError | ValidationError | JsonnetError | SystemError | ZenfigError | Error> {
  return pipe(
    // 1. Load schema
    loadSchemaWithDefaults(options.config.schema, options.config.schemaExportName),
    Effect.flatMap(({ schema }) =>
      // 2. Get provider
      pipe(
        getProvider(options.config.provider),
        Effect.map((provider) => ({ schema, provider }))
      )
    ),
    Effect.flatMap(({ provider, schema }) => {
      const { config, service, sources = [] } = options;
      const allServices = [service, ...sources];

      // 3-4. Fetch and parse all services
      return pipe(
        fetchAllServices(provider, config.ssmPrefix, config.env, allServices, schema, config.providerGuards),
        Effect.map((parsedServices) => ({ parsedServices, schema, config }))
      );
    }),
    Effect.flatMap(({ config, parsedServices, schema }) => {
      // 5. Merge all sources
      const mergeOptions: MergeOptions = {
        strictMerge: options.strictMerge ?? config.strict,
        warnOnOverride: options.warnOnOverride,
      };

      return pipe(
        mergeConfigs(parsedServices, mergeOptions),
        Effect.map((mergeResult) => {
          const warnings: Array<string> = [];

          // Log conflicts if any
          if (mergeResult.conflicts.length > 0 && options.warnOnOverride) {
            const conflictLog = formatConflicts(mergeResult.conflicts, true);
            warnings.push(`Merge conflicts:\n${conflictLog}`);
          }

          return { mergeResult, schema, config, warnings };
        })
      );
    }),
    Effect.flatMap(({ config, mergeResult, schema, warnings }) =>
      // 6. Evaluate Jsonnet template
      pipe(
        evaluateTemplate(mergeResult.merged, config.env, config.jsonnet, config.jsonnetTimeoutMs),
        Effect.flatMap((rendered) =>
          // 7. Validate against schema
          pipe(
            validate<Record<string, unknown>>(rendered, schema),
            Effect.map((validated) => ({
              validated,
              mergeResult,
              config,
              warnings,
            }))
          )
        )
      )
    ),
    Effect.map(({ config, mergeResult, validated, warnings }) => {
      // 8. Format output
      const formatted = formatConfig(validated, config.format, {
        separator: config.separator,
      });

      return {
        config: validated,
        formatted,
        conflicts: mergeResult.conflicts,
        warnings,
      };
    })
  );
}

/**
 * Run export and write to stdout
 */
export function runExport(
  options: ExportOptions
): Effect.Effect<void, ProviderError | ValidationError | JsonnetError | SystemError | ZenfigError | Error> {
  return pipe(
    executeExport(options),
    Effect.map((result) => {
      // Print warnings to stderr
      for (const warning of result.warnings) {
        console.error(`[zenfig] Warning: ${warning}`);
      }

      // Print formatted output to stdout
      process.stdout.write(result.formatted);
    })
  );
}
