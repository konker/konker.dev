/**
 * Export Command Tests
 */
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { ErrorCode } from '../errors.js';
import {
  basicParsedConfig,
  createBasicProviderData,
  createProviderData,
  createTestConfig,
  registerMockProviderWithData,
  schemaBasicPath,
} from '../test/fixtures/index.js';
import { executeExport, runExport } from './export.js';

describe('Export Command', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

  const baseConfig = createTestConfig({ schema: schemaBasicPath });
  const buildConfig = (provider: string, overrides: Partial<ResolvedConfig> = {}): ResolvedConfig => ({
    ...baseConfig,
    provider,
    ...overrides,
  });

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeExport', () => {
    it('should export configuration from provider', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: buildConfig(name),
        })
      );

      expect(result.config).toEqual(basicParsedConfig);
    });

    it('should format output as env', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: buildConfig(name, { format: 'env' }),
        })
      );

      expect(result.formatted).toContain('DATABASE_HOST=localhost');
      expect(result.formatted).toContain('DATABASE_PORT=5432');
      expect(result.formatted).toContain('FEATURE_ENABLE_BETA=true');
    });

    it('should format output as JSON', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: buildConfig(name, { format: 'json' }),
        })
      );

      const parsed = JSON.parse(result.formatted.trim());
      expect(parsed).toEqual(basicParsedConfig);
    });

    it('should merge multiple sources', async () => {
      const apiKv = {
        'database.host': 'api-host',
        'database.url': 'https://api.example.com',
        'api.timeout': '30000',
        'feature.enableBeta': 'true',
        tags: '["alpha","beta"]',
      };
      const sharedKv = {
        'database.port': '5432',
      };
      const { name } = registerMockProviderWithData({
        ...createProviderData('api', apiKv),
        ...createProviderData('shared', sharedKv),
      });

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          sources: ['shared'],
          config: buildConfig(name),
        })
      );

      expect(result.config).toEqual({
        database: {
          host: 'api-host',
          port: 5432,
          url: 'https://api.example.com',
        },
        api: {
          timeout: 30000,
        },
        feature: {
          enableBeta: true,
        },
        tags: ['alpha', 'beta'],
      });
    });

    it('should detect merge conflicts', async () => {
      const { name } = registerMockProviderWithData({
        ...createBasicProviderData('api'),
        ...createBasicProviderData('shared', { 'database.host': 'shared-host' }),
      });

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          sources: ['shared'],
          warnOnOverride: true,
          config: buildConfig(name),
        })
      );

      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should fail when schema validation fails', async () => {
      const { name } = registerMockProviderWithData(
        createBasicProviderData('api', {
          'database.port': '99999',
        })
      );

      const exit = await Effect.runPromiseExit(
        executeExport({
          service: 'api',
          config: buildConfig(name),
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        const error = exit.cause.error as { context?: { code?: string } };
        expect(error.context?.code).toBe(ErrorCode.VAL003);
      }
    });

    it('should warn on unknown keys when not strict', async () => {
      const { name } = registerMockProviderWithData(
        createBasicProviderData('api', {
          'unknown.key': 'oops',
        })
      );

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: buildConfig(name),
        })
      );

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should fail on unknown keys in strict mode', async () => {
      const { name } = registerMockProviderWithData(
        createBasicProviderData('api', {
          'unknown.key': 'oops',
        })
      );

      const exit = await Effect.runPromiseExit(
        executeExport({
          service: 'api',
          config: buildConfig(name, { strict: true }),
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        const error = exit.cause.error as { context?: { code?: string } };
        expect(error.context?.code).toBe(ErrorCode.VAL004);
      }
    });

    it('should use custom separator', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: buildConfig(name, { format: 'env', separator: '__' }),
        })
      );

      expect(result.formatted).toContain('DATABASE__HOST=localhost');
    });
  });

  describe('runExport', () => {
    it('should write formatted output to stdout', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      await Effect.runPromise(
        runExport({
          service: 'api',
          config: buildConfig(name, { format: 'json' }),
        })
      );

      expect(stdoutWriteSpy).toHaveBeenCalled();
      const output = stdoutWriteSpy.mock.calls[0]?.[0] as string;
      expect(JSON.parse(output.trim())).toEqual(basicParsedConfig);
    });

    it('should print warnings to stderr', async () => {
      const { name } = registerMockProviderWithData(
        createBasicProviderData('api', {
          'unknown.key': 'oops',
        })
      );

      await Effect.runPromise(
        runExport({
          service: 'api',
          config: buildConfig(name),
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Warning'));
    });
  });
});
