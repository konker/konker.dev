/**
 * Export Command
 *
 * Workflow: Fetch -> Parse -> Merge -> Inject -> Template -> Validate -> Format
 */
import * as Effect from 'effect/Effect';

import { type ResolvedConfig } from '../config.js';
import {
  type JsonnetError,
  type ProviderError,
  type SystemError,
  type ValidationError,
  type ZenfigError,
} from '../errors.js';
import { evaluateTemplate } from '../jsonnet/executor.js';
import { formatConflicts, mergeConfigs, type MergeOptions, type MergeResult } from '../lib/merge.js';
import { formatConfig } from '../lib/format.js';
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
const fetchService = (
  provider: Provider,
  ctx: ProviderContext
): Effect.Effect<ProviderKV, ProviderError> => provider.fetch(ctx);

/**
 * Fetch and parse values for multiple services
 */
const fetchAllServices = (
  provider: Provider,
  prefix: string,
  env: string,
  services: ReadonlyArray<string>,
  rootSchema: import('@sinclair/typebox').TSchema
): Effect.Effect<
  ReadonlyArray<readonly [string, Record<string, unknown>]>,
  ProviderError | ValidationError
> =>
  Effect.gen(function* () {
    const results: Array<readonly [string, Record<string, unknown>]> = [];

    for (const service of services) {
      const ctx: ProviderContext = { prefix, service, env };
      const kv = yield* fetchService(provider, ctx);
      const parsed = yield* parseProviderKV(kv, rootSchema);
      results.push([service, parsed] as const);
    }

    return results;
  });

// --------------------------------------------------------------------------
// Export Command
// --------------------------------------------------------------------------

/**
 * Execute the export workflow
 */
export const executeExport = (
  options: ExportOptions
): Effect.Effect<
  ExportResult,
  ProviderError | ValidationError | JsonnetError | SystemError | ZenfigError | Error
> =>
  Effect.gen(function* () {
    const { service, sources = [], config } = options;
    const warnings: Array<string> = [];

    // 1. Load schema
    const { schema } = yield* loadSchemaWithDefaults(config.schema, config.schemaExportName);

    // 2. Get provider
    const provider = yield* getProvider(config.provider);

    // 3. Build list of services to fetch (primary + sources)
    const allServices = [service, ...sources];

    // 4. Fetch and parse all services
    const parsedServices = yield* fetchAllServices(
      provider,
      config.ssmPrefix,
      config.env,
      allServices,
      schema
    );

    // 5. Merge all sources
    const mergeOptions: MergeOptions = {
      strictMerge: options.strictMerge ?? config.strict,
      warnOnOverride: options.warnOnOverride,
    };

    const mergeResult = yield* mergeConfigs(parsedServices, mergeOptions);

    // Log conflicts if any
    if (mergeResult.conflicts.length > 0 && options.warnOnOverride) {
      const conflictLog = formatConflicts(mergeResult.conflicts, true);
      warnings.push(`Merge conflicts:\n${conflictLog}`);
    }

    // 6. Evaluate Jsonnet template
    const rendered = yield* evaluateTemplate(
      mergeResult.merged,
      config.env,
      config.jsonnet,
      config.jsonnetTimeoutMs
    );

    // 7. Validate against schema
    const validated = yield* validate<Record<string, unknown>>(rendered, schema);

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
  });

/**
 * Run export and write to stdout
 */
export const runExport = (
  options: ExportOptions
): Effect.Effect<
  void,
  ProviderError | ValidationError | JsonnetError | SystemError | ZenfigError | Error
> =>
  Effect.gen(function* () {
    const result = yield* executeExport(options);

    // Print warnings to stderr
    for (const warning of result.warnings) {
      console.error(`[zenfig] Warning: ${warning}`);
    }

    // Print formatted output to stdout
    process.stdout.write(result.formatted);
  });
