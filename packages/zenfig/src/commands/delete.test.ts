/* eslint-disable fp/no-delete */
/**
 * Delete Command Tests
 */
import { createInterface } from 'node:readline';

import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { createMockProvider } from '../providers/MockProvider.js';
import { getProvider } from '../providers/registry.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { executeDelete, runDelete } from './delete.js';

vi.mock('node:readline', () => ({
  createInterface: vi.fn(),
}));

// Mock dependencies
vi.mock('../schema/loader.js', () => ({
  loadSchemaWithDefaults: vi.fn(),
}));

vi.mock('../providers/registry.js', () => ({
  getProvider: vi.fn(),
}));

describe('Delete Command', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let mockProvider: ReturnType<typeof createMockProvider>;
  const originalEnv = process.env;

  const defaultConfig: ResolvedConfig = {
    env: 'dev',
    provider: 'mock',
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

  const testSchema = Type.Object({
    database: Type.Object({
      host: Type.String(),
      port: Type.Integer(),
    }),
  });

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };

    const storageKey = '/zenfig/dev/api';
    mockProvider = createMockProvider({
      [storageKey]: {
        'database.host': 'localhost',
        'database.port': '5432',
      },
    });

    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

    vi.mocked(createInterface).mockReturnValue({
      question: (_message: string, cb: (answer: string) => void) => cb('y'),
      close: vi.fn(),
    } as unknown as ReturnType<typeof createInterface>);

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abc' }));
    vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('executeDelete', () => {
    it('should delete existing key with confirm flag', async () => {
      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: defaultConfig,
        })
      );

      expect(result.canonicalKey).toBe('database.host');
      expect(result.deleted).toBe(true);

      // Verify key was deleted
      const stored = await Effect.runPromise(mockProvider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBeUndefined();
    });

    it('should warn for key not in schema but still delete', async () => {
      // Add an extra key that exists in provider but not in schema
      const mockProviderWithUnknownKey = createMockProvider({
        '/zenfig/dev/api': {
          'database.host': 'localhost',
          'database.port': '5432',
          'unknown.key': 'some-value',
        },
      });
      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProviderWithUnknownKey));

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'unknown.key',
          confirm: true,
          config: defaultConfig,
        })
      );

      expect(result.canonicalKey).toBe('unknown.key');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Key 'unknown.key' not found in schema"));
    });

    it('should require confirm flag in CI mode', async () => {
      const ciConfig: ResolvedConfig = { ...defaultConfig, ci: true };

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          // No confirm flag
          config: ciConfig,
        })
      );

      expect(result.deleted).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('--confirm flag required in CI mode'));
    });

    it('should delete in CI mode with confirm flag', async () => {
      const ciConfig: ResolvedConfig = { ...defaultConfig, ci: true };

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: ciConfig,
        })
      );

      expect(result.deleted).toBe(true);
    });

    it('should log audit information', async () => {
      process.env.USER = 'testuser';

      await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: defaultConfig,
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/Deleted: database\.host by testuser/));
    });

    it('should fall back to USERNAME when USER is not set', async () => {
      delete process.env.USER;
      process.env.USERNAME = 'altuser';

      await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: defaultConfig,
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/Deleted: database\.host by altuser/));
    });

    it('should use unknown when no user info is available', async () => {
      delete process.env.USER;

      delete process.env.USERNAME;

      await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: defaultConfig,
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/Deleted: database\.host by unknown/));
    });

    it('should cancel deletion when prompt declines', async () => {
      vi.mocked(createInterface).mockReturnValueOnce({
        question: (_message: string, cb: (answer: string) => void) => cb('n'),
        close: vi.fn(),
      } as unknown as ReturnType<typeof createInterface>);

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          config: defaultConfig,
        })
      );

      expect(result.deleted).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Deletion cancelled.');

      const stored = await Effect.runPromise(mockProvider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('localhost');
    });

    it('should delete when prompt confirms', async () => {
      vi.mocked(createInterface).mockReturnValueOnce({
        question: (_message: string, cb: (answer: string) => void) => cb('y'),
        close: vi.fn(),
      } as unknown as ReturnType<typeof createInterface>);

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          config: defaultConfig,
        })
      );

      expect(result.deleted).toBe(true);
    });
  });

  describe('runDelete', () => {
    it('should print success message on deletion', async () => {
      const result = await Effect.runPromise(
        runDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: defaultConfig,
        })
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully deleted database.host'));
    });

    it('should return false when not deleted', async () => {
      const ciConfig: ResolvedConfig = { ...defaultConfig, ci: true };

      const result = await Effect.runPromise(
        runDelete({
          service: 'api',
          key: 'database.host',
          // No confirm flag
          config: ciConfig,
        })
      );

      expect(result).toBe(false);
    });
  });
});
