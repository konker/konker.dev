/**
 * Programmatic Export API
 */
import './providers/index.js';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { executeExport } from './commands/export.js';
import { type CLIOptions, resolveConfig, type ResolvedConfig } from './config.js';
import type { MergeConflict } from './lib/merge.js';

export type ExportApiOptions = {
  readonly service: string;
  readonly sources?: ReadonlyArray<string> | undefined;
  readonly format?: 'env' | 'json' | undefined;
  readonly separator?: string | undefined;
  readonly strict?: boolean | undefined;
  readonly strictMerge?: boolean | undefined;
  readonly warnOnOverride?: boolean | undefined;
  readonly config?: Partial<ResolvedConfig> | undefined;
};

export type ExportApiResult = {
  readonly config: Record<string, unknown>;
  readonly formatted: string;
  readonly conflicts: ReadonlyArray<MergeConflict>;
  readonly warnings: ReadonlyArray<string>;
};

function buildCliOptions(options: ExportApiOptions): CLIOptions {
  const overrides = options.config;

  return {
    env: overrides?.env,
    provider: overrides?.provider,
    ssmPrefix: overrides?.ssmPrefix,
    schema: overrides?.schema,
    validation: overrides?.validation,
    source: overrides?.sources,
    format: options.format ?? overrides?.format,
    separator: options.separator ?? overrides?.separator,
    cache: overrides?.cache,
    ci: overrides?.ci,
    strict: options.strict ?? overrides?.strict,
  };
}

function applyConfigOverrides(config: ResolvedConfig, overrides?: Partial<ResolvedConfig>): ResolvedConfig {
  if (!overrides) {
    return config;
  }

  return {
    ...config,
    providerGuards: overrides.providerGuards ?? config.providerGuards,
  };
}

export async function exportConfig(options: ExportApiOptions): Promise<ExportApiResult> {
  const cliOptions = buildCliOptions(options);

  return Effect.runPromise(
    pipe(
      resolveConfig(cliOptions),
      Effect.map((config) => applyConfigOverrides(config, options.config)),
      Effect.flatMap((config) =>
        executeExport({
          service: options.service,
          sources: options.sources ?? config.sources,
          config,
          strictMerge: options.strictMerge,
          warnOnOverride: options.warnOnOverride,
        })
      )
    )
  );
}
