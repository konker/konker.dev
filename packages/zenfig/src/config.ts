/**
 * Configuration Loading
 *
 * Handles zenfigrc.json/zenfigrc.json5 loading and environment variable precedence
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import * as Either from 'effect/Either';
import { pipe } from 'effect/Function';
import * as Schema from 'effect/Schema';
import JSON5 from 'json5';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/**
 * Zenfig configuration from zenfigrc.json/zenfigrc.json5
 */
export const ProviderGuardsSchema = Schema.Record({ key: Schema.String, value: Schema.Unknown });

/**
 * Provider guard configuration mapping
 */
export type ProviderGuardsConfig = Schema.Schema.Type<typeof ProviderGuardsSchema>;

export const ZenfigRcSchema = Schema.Struct({
  env: Schema.optional(Schema.String),
  provider: Schema.optional(Schema.String),
  ssmPrefix: Schema.optional(Schema.String),
  schema: Schema.optional(Schema.String),
  schemaExportName: Schema.optional(Schema.String),
  jsonnet: Schema.optional(Schema.String),
  sources: Schema.optional(Schema.Array(Schema.String)),
  format: Schema.optional(Schema.Union(Schema.Literal('env'), Schema.Literal('json'))),
  separator: Schema.optional(Schema.String),
  cache: Schema.optional(Schema.String),
  jsonnetTimeoutMs: Schema.optional(Schema.Number),
  providerGuards: Schema.optional(ProviderGuardsSchema),
});

/**
 * Zenfig configuration from zenfigrc.json/zenfigrc.json5
 */
export type ZenfigRcConfig = Schema.Schema.Type<typeof ZenfigRcSchema>;

export const ResolvedConfigSchema = Schema.Struct({
  env: Schema.String,
  provider: Schema.String,
  ssmPrefix: Schema.String,
  schema: Schema.String,
  schemaExportName: Schema.String,
  jsonnet: Schema.String,
  sources: Schema.Array(Schema.String),
  format: Schema.Union(Schema.Literal('env'), Schema.Literal('json')),
  separator: Schema.String,
  cache: Schema.optional(Schema.String),
  jsonnetTimeoutMs: Schema.Number,
  ci: Schema.Boolean,
  strict: Schema.Boolean,
  providerGuards: ProviderGuardsSchema,
});

/**
 * Resolved configuration with all values
 */
export type ResolvedConfig = Schema.Schema.Type<typeof ResolvedConfigSchema>;

export const CLIOptionsSchema = Schema.Struct({
  env: Schema.optional(Schema.String),
  provider: Schema.optional(Schema.String),
  ssmPrefix: Schema.optional(Schema.String),
  schema: Schema.optional(Schema.String),
  schemaExportName: Schema.optional(Schema.String),
  jsonnet: Schema.optional(Schema.String),
  source: Schema.optional(Schema.Array(Schema.String)),
  format: Schema.optional(Schema.Union(Schema.Literal('env'), Schema.Literal('json'))),
  separator: Schema.optional(Schema.String),
  cache: Schema.optional(Schema.String),
  noCache: Schema.optional(Schema.Boolean),
  jsonnetTimeout: Schema.optional(Schema.Number),
  ci: Schema.optional(Schema.Boolean),
  strict: Schema.optional(Schema.Boolean),
});

/**
 * CLI options that override config
 */
export type CLIOptions = Schema.Schema.Type<typeof CLIOptionsSchema>;

// --------------------------------------------------------------------------
// Defaults
// --------------------------------------------------------------------------

const DEFAULT_CONFIG: ResolvedConfig = {
  env: 'dev',
  provider: 'chamber',
  ssmPrefix: '/zenfig',
  schema: 'src/schema.ts',
  schemaExportName: 'ConfigSchema',
  jsonnet: 'config.jsonnet',
  sources: [],
  format: 'env',
  separator: '_',
  cache: undefined,
  jsonnetTimeoutMs: 30000,
  ci: false,
  strict: false,
  providerGuards: {},
};

// --------------------------------------------------------------------------
// Environment Variables
// --------------------------------------------------------------------------

function getEnvVar(name: string): string | undefined {
  return process.env[name];
}

function getEnvBool(name: string): boolean | undefined {
  const value = getEnvVar(name);
  if (value === undefined) return undefined;
  return value === '1' || value.toLowerCase() === 'true';
}

function getEnvInt(name: string): number | undefined {
  const value = getEnvVar(name);
  if (value === undefined) return undefined;
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? undefined : num;
}

// --------------------------------------------------------------------------
// Config File Loading
// --------------------------------------------------------------------------

const RC_FILENAMES = ['zenfigrc.json5', 'zenfigrc.json'] as const;

/**
 * Load zenfigrc.json/zenfigrc.json5 from the current directory or parent directories
 */
function loadRcFile(startDir: string): Effect.Effect<ZenfigRcConfig | undefined, never> {
  return Effect.sync(() => {
    let currentDir = startDir;
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      for (const fileName of RC_FILENAMES) {
        const rcPath = path.join(currentDir, fileName);
        try {
          if (fs.existsSync(rcPath)) {
            const content = fs.readFileSync(rcPath, 'utf-8');
            const parsed = JSON5.parse(content);
            const decoded = Schema.decodeUnknownEither(ZenfigRcSchema)(parsed);
            if (Either.isRight(decoded)) {
              return decoded.right;
            }
          }
        } catch {
          // Ignore parse errors, continue searching
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return undefined;
  });
}

// --------------------------------------------------------------------------
// Config Resolution
// --------------------------------------------------------------------------

/**
 * Check if running in CI mode
 */
function isCIMode(cliCi?: boolean): boolean {
  if (cliCi !== undefined) return cliCi;
  if (getEnvBool('ZENFIG_CI')) return true;
  if (!process.stdin.isTTY) return true;
  return false;
}

/**
 * Resolve configuration with precedence:
 * 1. CLI flags (highest)
 * 2. Environment variables
 * 3. zenfigrc.json/zenfigrc.json5
 * 4. Defaults (lowest)
 */
export function resolveConfig(cliOptions: CLIOptions = {}): Effect.Effect<ResolvedConfig, never> {
  return pipe(
    loadRcFile(process.cwd()),
    Effect.map((rcConfig) => {
      // Resolve env (special: also check NODE_ENV)
      const env =
        cliOptions.env ?? getEnvVar('ZENFIG_ENV') ?? rcConfig?.env ?? getEnvVar('NODE_ENV') ?? DEFAULT_CONFIG.env;

      // Resolve other values
      const provider =
        cliOptions.provider ?? getEnvVar('ZENFIG_PROVIDER') ?? rcConfig?.provider ?? DEFAULT_CONFIG.provider;

      const ssmPrefix =
        cliOptions.ssmPrefix ?? getEnvVar('ZENFIG_SSM_PREFIX') ?? rcConfig?.ssmPrefix ?? DEFAULT_CONFIG.ssmPrefix;

      const schema = cliOptions.schema ?? getEnvVar('ZENFIG_SCHEMA') ?? rcConfig?.schema ?? DEFAULT_CONFIG.schema;

      const schemaExportName =
        cliOptions.schemaExportName ??
        getEnvVar('ZENFIG_SCHEMA_EXPORT_NAME') ??
        rcConfig?.schemaExportName ??
        DEFAULT_CONFIG.schemaExportName;

      const jsonnet = cliOptions.jsonnet ?? getEnvVar('ZENFIG_JSONNET') ?? rcConfig?.jsonnet ?? DEFAULT_CONFIG.jsonnet;

      const sources = cliOptions.source ?? rcConfig?.sources ?? DEFAULT_CONFIG.sources;

      const format =
        (cliOptions.format as 'env' | 'json' | undefined) ??
        (getEnvVar('ZENFIG_FORMAT') as 'env' | 'json' | undefined) ??
        rcConfig?.format ??
        DEFAULT_CONFIG.format;

      const separator = cliOptions.separator ?? rcConfig?.separator ?? DEFAULT_CONFIG.separator;

      // Cache handling: --no-cache disables, otherwise use env or rc
      const cache = cliOptions.noCache
        ? undefined
        : (cliOptions.cache ?? getEnvVar('ZENFIG_CACHE') ?? rcConfig?.cache ?? DEFAULT_CONFIG.cache);

      const jsonnetTimeoutMs =
        cliOptions.jsonnetTimeout ??
        getEnvInt('ZENFIG_JSONNET_TIMEOUT_MS') ??
        rcConfig?.jsonnetTimeoutMs ??
        DEFAULT_CONFIG.jsonnetTimeoutMs;

      const ci = isCIMode(cliOptions.ci);
      const strict = cliOptions.strict ?? false;
      const providerGuards = rcConfig?.providerGuards ?? DEFAULT_CONFIG.providerGuards;

      return {
        env,
        provider,
        ssmPrefix,
        schema,
        schemaExportName,
        jsonnet,
        sources,
        format,
        separator,
        cache,
        jsonnetTimeoutMs,
        ci,
        strict,
        providerGuards,
      };
    })
  );
}

/**
 * Merge CLI options into resolved config
 */
export function mergeCliOptions(config: ResolvedConfig, cliOptions: CLIOptions): ResolvedConfig {
  return {
    ...config,
    env: cliOptions.env ?? config.env,
    provider: cliOptions.provider ?? config.provider,
    ssmPrefix: cliOptions.ssmPrefix ?? config.ssmPrefix,
    schema: cliOptions.schema ?? config.schema,
    schemaExportName: cliOptions.schemaExportName ?? config.schemaExportName,
    jsonnet: cliOptions.jsonnet ?? config.jsonnet,
    sources: cliOptions.source ?? config.sources,
    format: cliOptions.format ?? config.format,
    separator: cliOptions.separator ?? config.separator,
    cache: cliOptions.noCache ? undefined : (cliOptions.cache ?? config.cache),
    jsonnetTimeoutMs: cliOptions.jsonnetTimeout ?? config.jsonnetTimeoutMs,
    ci: cliOptions.ci ?? config.ci,
    strict: cliOptions.strict ?? config.strict,
    providerGuards: config.providerGuards,
  };
}
