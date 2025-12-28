/**
 * Upsert Command Tests
 */
import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { ErrorCode } from '../errors.js';
import { createMockProvider } from '../providers/MockProvider.js';
import { executeUpsert, runUpsert } from './upsert.js';

// Mock dependencies
vi.mock('../schema/loader.js', () => ({
  loadSchemaWithDefaults: vi.fn(),
}));

vi.mock('../providers/registry.js', () => ({
  getProvider: vi.fn(),
}));

import { loadSchemaWithDefaults } from '../schema/loader.js';
import { getProvider } from '../providers/registry.js';

describe('Upsert Command', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let mockProvider: ReturnType<typeof createMockProvider>;

  const defaultConfig: ResolvedConfig = {
    env: 'dev',
    provider: 'mock',
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

  const testSchema = Type.Object({
    database: Type.Object({
      host: Type.String(),
      port: Type.Integer({ minimum: 1, maximum: 65535 }),
    }),
    api: Type.Object({
      timeout: Type.Integer(),
    }),
  });

  beforeEach(() => {
    vi.resetAllMocks();
    mockProvider = createMockProvider();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(
      Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abc' })
    );
    vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeUpsert', () => {
    it('should upsert a string value', async () => {
      const result = await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.host',
          value: 'localhost',
          config: defaultConfig,
        })
      );

      expect(result.canonicalKey).toBe('database.host');
      expect(result.value).toBe('localhost');
      expect(result.serialized).toBe('localhost');
    });

    it('should upsert an integer value', async () => {
      const result = await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.port',
          value: '5432',
          config: defaultConfig,
        })
      );

      expect(result.canonicalKey).toBe('database.port');
      expect(result.value).toBe(5432);
      expect(result.serialized).toBe('5432');
    });

    it('should fail for invalid value type', async () => {
      const exit = await Effect.runPromiseExit(
        executeUpsert({
          service: 'api',
          key: 'database.port',
          value: 'not-a-number',
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
    });

    it('should fail for constraint violation', async () => {
      const exit = await Effect.runPromiseExit(
        executeUpsert({
          service: 'api',
          key: 'database.port',
          value: '99999', // Exceeds max 65535
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
    });

    it('should fail for unknown key', async () => {
      const exit = await Effect.runPromiseExit(
        executeUpsert({
          service: 'api',
          key: 'unknown.key',
          value: 'value',
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
    });

    it('should store value in provider', async () => {
      await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.host',
          value: 'myhost.example.com',
          config: defaultConfig,
        })
      );

      // Verify stored in provider
      const stored = await Effect.runPromise(
        mockProvider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' })
      );
      expect(stored['database.host']).toBe('myhost.example.com');
    });

    it('should use explicit type when provided', async () => {
      const result = await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.port',
          value: '8080',
          type: 'integer',
          config: defaultConfig,
        })
      );

      expect(result.value).toBe(8080);
    });
  });

  describe('runUpsert', () => {
    it('should print success message', async () => {
      await Effect.runPromise(
        runUpsert({
          service: 'api',
          key: 'database.host',
          value: 'localhost',
          config: defaultConfig,
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully wrote database.host')
      );
    });

    it('should warn if value may not be encrypted', async () => {
      // Create a mock provider that reports not encrypted
      const nonEncryptingProvider = createMockProvider();
      nonEncryptingProvider.capabilities.encryptionVerification = true;
      nonEncryptingProvider.verifyEncryption = () => Effect.succeed('String' as const);

      vi.mocked(getProvider).mockReturnValue(Effect.succeed(nonEncryptingProvider));

      await Effect.runPromise(
        runUpsert({
          service: 'api',
          key: 'database.host',
          value: 'localhost',
          config: defaultConfig,
        })
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Value may not be encrypted')
      );
    });
  });
});
