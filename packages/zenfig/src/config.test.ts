/**
 * Configuration Tests
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { type CLIOptions, mergeCliOptions, resolveConfig, type ResolvedConfig } from './config.js';
import { createTempDir, removeDir, writeFile } from './test/fixtures/index.js';

describe('config', () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  const originalStdin = process.stdin;
  let tempDir: string;

  beforeEach(() => {
    process.env = { ...originalEnv };
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('ZENFIG_')) {
        // eslint-disable-next-line fp/no-delete
        delete process.env[key];
      }
    });
    // eslint-disable-next-line fp/no-delete
    delete process.env.NODE_ENV;
    tempDir = createTempDir('zenfig-config-');
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.env = originalEnv;
    process.chdir(originalCwd);
    Object.defineProperty(process, 'stdin', { value: originalStdin });
    removeDir(tempDir);
  });

  describe('resolveConfig', () => {
    it('returns defaults when no config sources exist', async () => {
      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('dev');
      expect(result.provider).toBe('aws-ssm');
      expect(result.ssmPrefix).toBe('/zenfig');
      expect(result.schema).toBe('src/schema.ts');
      expect(result.schemaExportName).toBe('ConfigSchema');
      expect(result.sources).toEqual([]);
      expect(result.format).toBe('env');
      expect(result.separator).toBe('_');
      expect(result.cache).toBeUndefined();
      expect(result.strict).toBe(false);
      expect(result.providerGuards).toEqual({});
    });

    it('prefers ZENFIG_ENV over NODE_ENV', async () => {
      process.env.ZENFIG_ENV = 'staging';
      process.env.NODE_ENV = 'production';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('staging');
    });

    it('uses environment variable overrides', async () => {
      process.env.ZENFIG_PROVIDER = 'aws-ssm';
      process.env.ZENFIG_SSM_PREFIX = '/custom/prefix';
      process.env.ZENFIG_SCHEMA = 'custom-schema.ts';
      process.env.ZENFIG_SCHEMA_EXPORT_NAME = 'MySchema';
      process.env.ZENFIG_FORMAT = 'json';
      process.env.ZENFIG_CACHE = '.cache/zenfig';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.provider).toBe('aws-ssm');
      expect(result.ssmPrefix).toBe('/custom/prefix');
      expect(result.schema).toBe('custom-schema.ts');
      expect(result.schemaExportName).toBe('MySchema');
      expect(result.format).toBe('json');
      expect(result.cache).toBe('.cache/zenfig');
    });

    it('loads config from zenfigrc.json', async () => {
      const rcConfig = {
        env: 'staging',
        provider: 'aws-ssm',
        ssmPrefix: '/app',
        schema: 'config/schema.ts',
        schemaExportName: 'AppSchema',
        sources: ['source1.json', 'source2.json'],
        format: 'json',
        separator: '__',
        cache: '.zenfig-cache',
        providerGuards: {
          'aws-ssm': {
            accountId: '123456789012',
            region: 'us-east-1',
          },
        },
      };

      writeFile(path.join(tempDir, 'zenfigrc.json'), JSON.stringify(rcConfig));

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('staging');
      expect(result.provider).toBe('aws-ssm');
      expect(result.ssmPrefix).toBe('/app');
      expect(result.schema).toBe('config/schema.ts');
      expect(result.schemaExportName).toBe('AppSchema');
      expect(result.sources).toEqual(['source1.json', 'source2.json']);
      expect(result.format).toBe('json');
      expect(result.separator).toBe('__');
      expect(result.cache).toBe('.zenfig-cache');
      expect(result.providerGuards).toEqual({
        'aws-ssm': {
          accountId: '123456789012',
          region: 'us-east-1',
        },
      });
    });

    it('loads config from zenfigrc.json5 with JSON5 syntax', async () => {
      writeFile(
        path.join(tempDir, 'zenfigrc.json5'),
        `{
          // JSON5 comments allowed
          env: 'staging',
          provider: 'aws-ssm',
          ssmPrefix: '/app',
          schema: 'config/schema.ts',
          schemaExportName: 'AppSchema',
          sources: ['source1.json', 'source2.json'],
          format: 'json',
          separator: '__',
          cache: '.zenfig-cache',
          providerGuards: {
            'aws-ssm': {
              accountId: '123456789012',
              region: 'us-east-1',
            },
          },
        }`
      );

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('staging');
      expect(result.provider).toBe('aws-ssm');
      expect(result.ssmPrefix).toBe('/app');
      expect(result.schema).toBe('config/schema.ts');
      expect(result.schemaExportName).toBe('AppSchema');
      expect(result.sources).toEqual(['source1.json', 'source2.json']);
      expect(result.format).toBe('json');
      expect(result.separator).toBe('__');
      expect(result.cache).toBe('.zenfig-cache');
    });

    it('searches parent directories for zenfigrc.json', async () => {
      writeFile(path.join(tempDir, 'zenfigrc.json'), JSON.stringify({ env: 'parent' }));
      const childDir = path.join(tempDir, 'child');
      fs.mkdirSync(childDir, { recursive: true });
      process.chdir(childDir);

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('parent');
    });

    it('ignores invalid rc files and falls back to defaults', async () => {
      writeFile(path.join(tempDir, 'zenfigrc.json'), '{ invalid json }');

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('dev');
    });

    it('gives CLI options highest priority', async () => {
      writeFile(path.join(tempDir, 'zenfigrc.json'), JSON.stringify({ env: 'rc-env', provider: 'rc-provider' }));
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

    it('uses CLI options for format, separator, and cache', async () => {
      const cliOptions: CLIOptions = {
        format: 'json',
        separator: '__',
        cache: '.cli-cache',
      };

      const result = await Effect.runPromise(resolveConfig(cliOptions));

      expect(result.format).toBe('json');
      expect(result.separator).toBe('__');
      expect(result.cache).toBe('.cli-cache');
    });

    it('disables cache with noCache option', async () => {
      writeFile(path.join(tempDir, 'zenfigrc.json'), JSON.stringify({ cache: '.rc-cache' }));

      const result = await Effect.runPromise(resolveConfig({ noCache: true }));

      expect(result.cache).toBeUndefined();
    });

    it('treats stdin as CI when not a TTY', async () => {
      Object.defineProperty(process, 'stdin', { value: { isTTY: false }, configurable: true });

      const result = await Effect.runPromise(resolveConfig());

      expect(result.ci).toBe(true);
    });
  });

  describe('mergeCliOptions', () => {
    const baseConfig: ResolvedConfig = {
      env: 'dev',
      provider: 'aws-ssm',
      ssmPrefix: '/zenfig',
      schema: 'src/schema.ts',
      schemaExportName: 'ConfigSchema',
      sources: [],
      format: 'env',
      separator: '_',
      cache: undefined,
      ci: false,
      strict: false,
      providerGuards: {},
    };

    it('overrides values from CLI', () => {
      const result = mergeCliOptions(baseConfig, {
        env: 'prod',
        provider: 'custom',
        ssmPrefix: '/custom',
        schema: 'custom.ts',
        schemaExportName: 'Custom',
        source: ['a.json', 'b.json'],
        format: 'json',
        separator: '__',
        cache: '.cache',
        ci: true,
        strict: true,
      });

      expect(result.env).toBe('prod');
      expect(result.provider).toBe('custom');
      expect(result.ssmPrefix).toBe('/custom');
      expect(result.schema).toBe('custom.ts');
      expect(result.schemaExportName).toBe('Custom');
      expect(result.sources).toEqual(['a.json', 'b.json']);
      expect(result.format).toBe('json');
      expect(result.separator).toBe('__');
      expect(result.cache).toBe('.cache');
      expect(result.ci).toBe(true);
      expect(result.strict).toBe(true);
    });

    it('clears cache when noCache is set', () => {
      const configWithCache = { ...baseConfig, cache: '.existing-cache' };
      const result = mergeCliOptions(configWithCache, { noCache: true });

      expect(result.cache).toBeUndefined();
    });
  });
});
