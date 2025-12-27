/**
 * Configuration Loading
 *
 * Handles .zenfigrc.json loading and environment variable precedence
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/**
 * Zenfig configuration from .zenfigrc.json
 */
export type ZenfigRcConfig = {
  readonly env?: string;
  readonly provider?: string;
  readonly ssmPrefix?: string;
  readonly schema?: string;
  readonly schemaExportName?: string;
  readonly jsonnet?: string;
  readonly sources?: ReadonlyArray<string>;
  readonly format?: 'env' | 'json';
  readonly separator?: string;
  readonly cache?: string;
  readonly jsonnetTimeoutMs?: number;
};

/**
 * Resolved configuration with all values
 */
export type ResolvedConfig = {
  readonly env: string;
  readonly provider: string;
  readonly ssmPrefix: string;
  readonly schema: string;
  readonly schemaExportName: string;
  readonly jsonnet: string;
  readonly sources: ReadonlyArray<string>;
  readonly format: 'env' | 'json';
  readonly separator: string;
  readonly cache: string | undefined;
  readonly jsonnetTimeoutMs: number;
  readonly ci: boolean;
  readonly strict: boolean;
};

/**
 * CLI options that override config
 */
export type CLIOptions = {
  readonly env?: string | undefined;
  readonly provider?: string | undefined;
  readonly ssmPrefix?: string | undefined;
  readonly schema?: string | undefined;
  readonly schemaExportName?: string | undefined;
  readonly jsonnet?: string | undefined;
  readonly source?: ReadonlyArray<string> | undefined;
  readonly format?: 'env' | 'json' | undefined;
  readonly separator?: string | undefined;
  readonly cache?: string | undefined;
  readonly noCache?: boolean | undefined;
  readonly jsonnetTimeout?: number | undefined;
  readonly ci?: boolean | undefined;
  readonly strict?: boolean | undefined;
};

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
};

// --------------------------------------------------------------------------
// Environment Variables
// --------------------------------------------------------------------------

const getEnvVar = (name: string): string | undefined => process.env[name];

const getEnvBool = (name: string): boolean | undefined => {
  const value = getEnvVar(name);
  if (value === undefined) return undefined;
  return value === '1' || value.toLowerCase() === 'true';
};

const getEnvInt = (name: string): number | undefined => {
  const value = getEnvVar(name);
  if (value === undefined) return undefined;
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? undefined : num;
};

// --------------------------------------------------------------------------
// Config File Loading
// --------------------------------------------------------------------------

/**
 * Load .zenfigrc.json from the current directory or parent directories
 */
const loadRcFile = (startDir: string): Effect.Effect<ZenfigRcConfig | undefined, never> =>
  Effect.sync(() => {
    let currentDir = startDir;
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const rcPath = path.join(currentDir, '.zenfigrc.json');
      try {
        if (fs.existsSync(rcPath)) {
          const content = fs.readFileSync(rcPath, 'utf-8');
          return JSON.parse(content) as ZenfigRcConfig;
        }
      } catch {
        // Ignore parse errors, continue searching
      }
      currentDir = path.dirname(currentDir);
    }

    return undefined;
  });

// --------------------------------------------------------------------------
// Config Resolution
// --------------------------------------------------------------------------

/**
 * Check if running in CI mode
 */
const isCIMode = (cliCi?: boolean): boolean => {
  if (cliCi !== undefined) return cliCi;
  if (getEnvBool('ZENFIG_CI')) return true;
  if (!process.stdin.isTTY) return true;
  return false;
};

/**
 * Resolve configuration with precedence:
 * 1. CLI flags (highest)
 * 2. Environment variables
 * 3. .zenfigrc.json
 * 4. Defaults (lowest)
 */
export const resolveConfig = (cliOptions: CLIOptions = {}): Effect.Effect<ResolvedConfig, never> =>
  pipe(
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
      };
    })
  );

/**
 * Merge CLI options into resolved config
 */
export const mergeCliOptions = (config: ResolvedConfig, cliOptions: CLIOptions): ResolvedConfig => ({
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
});
