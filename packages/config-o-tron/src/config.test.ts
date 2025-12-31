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
      if (key.startsWith('CONFIG_O_TRON_')) {
        // eslint-disable-next-line fp/no-delete
        delete process.env[key];
      }
    });
    // eslint-disable-next-line fp/no-delete
    delete process.env.NODE_ENV;
    tempDir = createTempDir('config-o-tron-config-');
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
      expect(result.ssmPrefix).toBe('/config-o-tron');
      expect(result.schema).toBe('src/schema.ts');
      expect(result.validation).toBe('effect');
      expect(result.sources).toEqual([]);
      expect(result.format).toBe('env');
      expect(result.separator).toBe('_');
      expect(result.cache).toBeUndefined();
      expect(result.strict).toBe(false);
      expect(result.providerGuards).toEqual({});
    });

    it('prefers CONFIG_O_TRON_ENV over NODE_ENV', async () => {
      process.env.CONFIG_O_TRON_ENV = 'staging';
      process.env.NODE_ENV = 'production';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('staging');
    });

    it('uses environment variable overrides', async () => {
      process.env.CONFIG_O_TRON_PROVIDER = 'aws-ssm';
      process.env.CONFIG_O_TRON_SSM_PREFIX = '/custom/prefix';
      process.env.CONFIG_O_TRON_SCHEMA = 'custom-schema.ts';
      process.env.CONFIG_O_TRON_VALIDATION = 'zod';
      process.env.CONFIG_O_TRON_FORMAT = 'json';
      process.env.CONFIG_O_TRON_CACHE = '.cache/config-o-tron';

      const result = await Effect.runPromise(resolveConfig());

      expect(result.provider).toBe('aws-ssm');
      expect(result.ssmPrefix).toBe('/custom/prefix');
      expect(result.schema).toBe('custom-schema.ts');
      expect(result.validation).toBe('zod');
      expect(result.format).toBe('json');
      expect(result.cache).toBe('.cache/config-o-tron');
    });

    it('loads config from config-o-tronrc.json', async () => {
      const rcConfig = {
        env: 'staging',
        provider: 'aws-ssm',
        ssmPrefix: '/app',
        schema: 'config/schema.ts',
        validation: 'zod',
        sources: ['source1.json', 'source2.json'],
        format: 'json',
        separator: '__',
        cache: '.config-o-tron-cache',
        providerGuards: {
          'aws-ssm': {
            accountId: '123456789012',
            region: 'us-east-1',
          },
        },
      };

      writeFile(path.join(tempDir, 'config-o-tronrc.json'), JSON.stringify(rcConfig));

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('staging');
      expect(result.provider).toBe('aws-ssm');
      expect(result.ssmPrefix).toBe('/app');
      expect(result.schema).toBe('config/schema.ts');
      expect(result.validation).toBe('zod');
      expect(result.sources).toEqual(['source1.json', 'source2.json']);
      expect(result.format).toBe('json');
      expect(result.separator).toBe('__');
      expect(result.cache).toBe('.config-o-tron-cache');
      expect(result.providerGuards).toEqual({
        'aws-ssm': {
          accountId: '123456789012',
          region: 'us-east-1',
        },
      });
    });

    it('loads config from config-o-tronrc.json5 with JSON5 syntax', async () => {
      writeFile(
        path.join(tempDir, 'config-o-tronrc.json5'),
        `{
          // JSON5 comments allowed
          env: 'staging',
          provider: 'aws-ssm',
          ssmPrefix: '/app',
          schema: 'config/schema.ts',
          validation: 'zod',
          sources: ['source1.json', 'source2.json'],
          format: 'json',
          separator: '__',
          cache: '.config-o-tron-cache',
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
      expect(result.validation).toBe('zod');
      expect(result.sources).toEqual(['source1.json', 'source2.json']);
      expect(result.format).toBe('json');
      expect(result.separator).toBe('__');
      expect(result.cache).toBe('.config-o-tron-cache');
    });

    it('searches parent directories for config-o-tronrc.json', async () => {
      writeFile(path.join(tempDir, 'config-o-tronrc.json'), JSON.stringify({ env: 'parent' }));
      const childDir = path.join(tempDir, 'child');
      fs.mkdirSync(childDir, { recursive: true });
      process.chdir(childDir);

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('parent');
    });

    it('ignores invalid rc files and falls back to defaults', async () => {
      writeFile(path.join(tempDir, 'config-o-tronrc.json'), '{ invalid json }');

      const result = await Effect.runPromise(resolveConfig());

      expect(result.env).toBe('dev');
    });

    it('gives CLI options highest priority', async () => {
      writeFile(path.join(tempDir, 'config-o-tronrc.json'), JSON.stringify({ env: 'rc-env', provider: 'rc-provider' }));
      process.env.CONFIG_O_TRON_ENV = 'env-env';
      process.env.CONFIG_O_TRON_PROVIDER = 'env-provider';

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
      writeFile(path.join(tempDir, 'config-o-tronrc.json'), JSON.stringify({ cache: '.rc-cache' }));

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
      ssmPrefix: '/config-o-tron',
      schema: 'src/schema.ts',
      validation: 'effect',
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
        validation: 'zod',
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
      expect(result.validation).toBe('zod');
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
