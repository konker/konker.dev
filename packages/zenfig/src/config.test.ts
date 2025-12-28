/* eslint-disable fp/no-delete */
/**
 * Configuration Tests
 */
import * as fs from 'node:fs';

import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type CLIOptions, mergeCliOptions, resolveConfig, type ResolvedConfig } from './config.js';

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('config', () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd;
  const originalStdin = process.stdin;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    // Clear all ZENFIG_* env vars
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('ZENFIG_')) {
        delete process.env[key];
      }
    });
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = originalEnv;
    process.cwd = originalCwd;
    Object.defineProperty(process, 'stdin', { value: originalStdin });
  });

  describe('resolveConfig with defaults', () => {
    it('should return default values when no config sources exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('dev');
      expect(result.provider).toBe('chamber');
      expect(result.ssmPrefix).toBe('/zenfig');
      expect(result.schema).toBe('src/schema.ts');
      expect(result.schemaExportName).toBe('ConfigSchema');
      expect(result.jsonnet).toBe('config.jsonnet');
      expect(result.sources).toEqual([]);
      expect(result.format).toBe('env');
      expect(result.separator).toBe('_');
      expect(result.cache).toBeUndefined();
      expect(result.jsonnetTimeoutMs).toBe(30000);
      expect(result.strict).toBe(false);
      expect(result.providerGuards).toEqual({});
    });
  });

  describe('resolveConfig with environment variables', () => {
    it('should use ZENFIG_ENV when set', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_ENV = 'production';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('production');
    });

    it('should use NODE_ENV as fallback for env', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.NODE_ENV = 'test';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('test');
    });

    it('should prefer ZENFIG_ENV over NODE_ENV', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_ENV = 'staging';
      process.env.NODE_ENV = 'production';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('staging');
    });

    it('should use ZENFIG_PROVIDER when set', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_PROVIDER = 'ssm';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.provider).toBe('ssm');
    });

    it('should use ZENFIG_SSM_PREFIX when set', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_SSM_PREFIX = '/custom/prefix';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.ssmPrefix).toBe('/custom/prefix');
    });

    it('should use ZENFIG_SCHEMA when set', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_SCHEMA = 'custom-schema.ts';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.schema).toBe('custom-schema.ts');
    });

    it('should use ZENFIG_SCHEMA_EXPORT_NAME when set', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_SCHEMA_EXPORT_NAME = 'MySchema';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.schemaExportName).toBe('MySchema');
    });

    it('should use ZENFIG_JSONNET when set', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_JSONNET = 'custom.jsonnet';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.jsonnet).toBe('custom.jsonnet');
    });

    it('should use ZENFIG_FORMAT when set', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_FORMAT = 'json';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.format).toBe('json');
    });

    it('should use ZENFIG_CACHE when set', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_CACHE = '.cache/zenfig';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.cache).toBe('.cache/zenfig');
    });

    it('should use ZENFIG_JSONNET_TIMEOUT_MS when set with valid integer', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_JSONNET_TIMEOUT_MS = '60000';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.jsonnetTimeoutMs).toBe(60000);
    });

    it('should ignore ZENFIG_JSONNET_TIMEOUT_MS when not a valid integer', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_JSONNET_TIMEOUT_MS = 'invalid';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.jsonnetTimeoutMs).toBe(30000); // default
    });

    it('should use ZENFIG_CI when set to true', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_CI = 'true';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.ci).toBe(true);
    });

    it('should use ZENFIG_CI when set to 1', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_CI = '1';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.ci).toBe(true);
    });

    it('should not use ZENFIG_CI when set to false', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_CI = 'false';
      // Mock stdin as TTY to avoid CI mode being set
      Object.defineProperty(process, 'stdin', { value: { isTTY: true }, configurable: true });

      const result = await Effect.runPromise(resolveConfig());

      expect(result.ci).toBe(false);
    });
  });

  describe('resolveConfig with zenfigrc.json/zenfigrc.json5', () => {
    it('should load config from zenfigrc.json', async () => {
      const rcConfig = {
        env: 'staging',
        provider: 'ssm',
        ssmPrefix: '/app',
        schema: 'config/schema.ts',
        schemaExportName: 'AppSchema',
        jsonnet: 'app.jsonnet',
        sources: ['source1.json', 'source2.json'],
        format: 'json' as const,
        separator: '__',
        cache: '.zenfig-cache',
        jsonnetTimeoutMs: 45000,
        providerGuards: {
          chamber: {
            accountId: '123456789012',
            region: 'us-east-1',
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(rcConfig));

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('staging');
      expect(result.provider).toBe('ssm');
      expect(result.ssmPrefix).toBe('/app');
      expect(result.schema).toBe('config/schema.ts');
      expect(result.schemaExportName).toBe('AppSchema');
      expect(result.jsonnet).toBe('app.jsonnet');
      expect(result.sources).toEqual(['source1.json', 'source2.json']);
      expect(result.format).toBe('json');
      expect(result.separator).toBe('__');
      expect(result.cache).toBe('.zenfig-cache');
      expect(result.jsonnetTimeoutMs).toBe(45000);
      expect(result.providerGuards).toEqual({
        chamber: {
          accountId: '123456789012',
          region: 'us-east-1',
        },
      });
    });

    it('should load config from zenfigrc.json5 with JSON5 syntax', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`{
        // JSON5 comments allowed
        env: 'staging',
        provider: 'ssm',
        ssmPrefix: '/app',
        schema: 'config/schema.ts',
        schemaExportName: 'AppSchema',
        jsonnet: 'app.jsonnet',
        sources: ['source1.json', 'source2.json'],
        format: 'json',
        separator: '__',
        cache: '.zenfig-cache',
        jsonnetTimeoutMs: 45000,
        providerGuards: {
          chamber: {
            accountId: '123456789012',
            region: 'us-east-1',
          },
        },
      }`);

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('staging');
      expect(result.provider).toBe('ssm');
      expect(result.ssmPrefix).toBe('/app');
      expect(result.schema).toBe('config/schema.ts');
      expect(result.schemaExportName).toBe('AppSchema');
      expect(result.jsonnet).toBe('app.jsonnet');
      expect(result.sources).toEqual(['source1.json', 'source2.json']);
      expect(result.format).toBe('json');
      expect(result.separator).toBe('__');
      expect(result.cache).toBe('.zenfig-cache');
      expect(result.jsonnetTimeoutMs).toBe(45000);
      expect(result.providerGuards).toEqual({
        chamber: {
          accountId: '123456789012',
          region: 'us-east-1',
        },
      });
    });

    it('should continue searching parent directories for zenfigrc.json', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await Effect.runPromise(resolveConfig());

      // Should fall back to defaults
      expect(result.env).toBe('dev');
    });

    it('should handle parse errors in zenfigrc.json gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json }');

      const result = await Effect.runPromise(resolveConfig());

      // Should fall back to defaults
      expect(result.env).toBe('dev');
    });
  });

  describe('resolveConfig with CLI options', () => {
    it('should use CLI options with highest priority', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ env: 'rc-env', provider: 'rc-provider' }));
      process.env.ZENFIG_ENV = 'env-env';
      process.env.ZENFIG_PROVIDER = 'env-provider';

      const cliOptions: CLIOptions = {
        env: 'cli-env',
        provider: 'cli-provider',
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.env).toBe('cli-env');
      expect(result.provider).toBe('cli-provider');
    });

    it('should use CLI source option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        source: ['cli-source1.json', 'cli-source2.json'],
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.sources).toEqual(['cli-source1.json', 'cli-source2.json']);
    });

    it('should use CLI ssmPrefix option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        ssmPrefix: '/cli-prefix',
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.ssmPrefix).toBe('/cli-prefix');
    });

    it('should use CLI schema option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        schema: 'cli-schema.ts',
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.schema).toBe('cli-schema.ts');
    });

    it('should use CLI schemaExportName option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        schemaExportName: 'CLISchema',
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.schemaExportName).toBe('CLISchema');
    });

    it('should use CLI jsonnet option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        jsonnet: 'cli.jsonnet',
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.jsonnet).toBe('cli.jsonnet');
    });

    it('should use CLI format option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        format: 'json',
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.format).toBe('json');
    });

    it('should use CLI separator option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        separator: '__',
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.separator).toBe('__');
    });

    it('should use CLI cache option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        cache: '.cli-cache',
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.cache).toBe('.cli-cache');
    });

    it('should disable cache with noCache option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ cache: '.rc-cache' }));

      const cliOptions: CLIOptions = {
        noCache: true,
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.cache).toBeUndefined();
    });

    it('should use CLI jsonnetTimeout option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        jsonnetTimeout: 90000,
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.jsonnetTimeoutMs).toBe(90000);
    });

    it('should use CLI ci option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      Object.defineProperty(process, 'stdin', { value: { isTTY: true }, configurable: true });

      const cliOptions: CLIOptions = {
        ci: true,
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.ci).toBe(true);
    });

    it('should use CLI ci=false to disable CI mode', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      process.env.ZENFIG_CI = 'true';

      const cliOptions: CLIOptions = {
        ci: false,
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.ci).toBe(false);
    });

    it('should use CLI strict option', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const cliOptions: CLIOptions = {
        strict: true,
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.strict).toBe(true);
    });
  });

  describe('CI mode detection', () => {
    it('should enable CI mode when stdin is not TTY', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      Object.defineProperty(process, 'stdin', { value: { isTTY: false }, configurable: true });

      const result = await Effect.runPromise(resolveConfig());

      expect(result.ci).toBe(true);
    });

    it('should disable CI mode when stdin is TTY', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      Object.defineProperty(process, 'stdin', { value: { isTTY: true }, configurable: true });

      const result = await Effect.runPromise(resolveConfig());

      expect(result.ci).toBe(false);
    });
  });

  describe('mergeCliOptions', () => {
    const baseConfig: ResolvedConfig = {
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

    it('should override env from CLI', () => {
      const result = mergeCliOptions(baseConfig, { env: 'prod' });
      expect(result.env).toBe('prod');
    });

    it('should override provider from CLI', () => {
      const result = mergeCliOptions(baseConfig, { provider: 'ssm' });
      expect(result.provider).toBe('ssm');
    });

    it('should override ssmPrefix from CLI', () => {
      const result = mergeCliOptions(baseConfig, { ssmPrefix: '/custom' });
      expect(result.ssmPrefix).toBe('/custom');
    });

    it('should override schema from CLI', () => {
      const result = mergeCliOptions(baseConfig, { schema: 'custom.ts' });
      expect(result.schema).toBe('custom.ts');
    });

    it('should override schemaExportName from CLI', () => {
      const result = mergeCliOptions(baseConfig, { schemaExportName: 'Custom' });
      expect(result.schemaExportName).toBe('Custom');
    });

    it('should override jsonnet from CLI', () => {
      const result = mergeCliOptions(baseConfig, { jsonnet: 'custom.jsonnet' });
      expect(result.jsonnet).toBe('custom.jsonnet');
    });

    it('should override sources from CLI', () => {
      const result = mergeCliOptions(baseConfig, { source: ['a.json', 'b.json'] });
      expect(result.sources).toEqual(['a.json', 'b.json']);
    });

    it('should override format from CLI', () => {
      const result = mergeCliOptions(baseConfig, { format: 'json' });
      expect(result.format).toBe('json');
    });

    it('should override separator from CLI', () => {
      const result = mergeCliOptions(baseConfig, { separator: '__' });
      expect(result.separator).toBe('__');
    });

    it('should override cache from CLI', () => {
      const result = mergeCliOptions(baseConfig, { cache: '.cache' });
      expect(result.cache).toBe('.cache');
    });

    it('should clear cache with noCache from CLI', () => {
      const configWithCache = { ...baseConfig, cache: '.existing-cache' };
      const result = mergeCliOptions(configWithCache, { noCache: true });
      expect(result.cache).toBeUndefined();
    });

    it('should override jsonnetTimeoutMs from CLI', () => {
      const result = mergeCliOptions(baseConfig, { jsonnetTimeout: 60000 });
      expect(result.jsonnetTimeoutMs).toBe(60000);
    });

    it('should override ci from CLI', () => {
      const result = mergeCliOptions(baseConfig, { ci: true });
      expect(result.ci).toBe(true);
    });

    it('should override strict from CLI', () => {
      const result = mergeCliOptions(baseConfig, { strict: true });
      expect(result.strict).toBe(true);
    });

    it('should keep config values when CLI options are undefined', () => {
      const result = mergeCliOptions(baseConfig, {});
      expect(result).toEqual(baseConfig);
    });
  });
});
