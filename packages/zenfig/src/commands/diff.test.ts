/**
 * Diff Command Tests
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { createMockProvider } from '../providers/MockProvider.js';
import { executeDiff, runDiff } from './diff.js';

// Mock dependencies
vi.mock('../schema/loader.js', () => ({
  loadSchemaWithDefaults: vi.fn(),
}));

vi.mock('../providers/registry.js', () => ({
  getProvider: vi.fn(),
}));

vi.mock('../jsonnet/executor.js', () => ({
  evaluateTemplate: vi.fn(),
}));

import { loadSchemaWithDefaults } from '../schema/loader.js';
import { getProvider } from '../providers/registry.js';
import { evaluateTemplate } from '../jsonnet/executor.js';

describe('Diff Command', () => {
  let tempDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
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
      port: Type.Integer(),
    }),
    api: Type.Object({
      timeout: Type.Integer(),
    }),
  });

  beforeEach(() => {
    vi.resetAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenfig-diff-test-'));
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());

    const storageKey = '/zenfig/api/dev';
    mockProvider = createMockProvider({
      [storageKey]: {
        'database.host': 'localhost',
        'database.port': '5432',
        'api.timeout': '30000',
      },
    });

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(
      Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abc' })
    );
    vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));
  });

  afterEach(() => {
    vi.restoreAllMocks();

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('executeDiff', () => {
    it('should detect no changes when stored equals rendered', async () => {
      // Jsonnet returns same values as stored
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
          api: { timeout: 30000 },
        })
      );

      const result = await Effect.runPromise(
        executeDiff({
          service: 'api',
          config: defaultConfig,
        })
      );

      expect(result.hasChanges).toBe(false);
      expect(result.entries.every((e) => e.status === 'unchanged')).toBe(true);
    });

    it('should detect modified values', async () => {
      // Jsonnet returns different values
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'production-host', port: 5432 },
          api: { timeout: 60000 },
        })
      );

      const result = await Effect.runPromise(
        executeDiff({
          service: 'api',
          config: defaultConfig,
        })
      );

      expect(result.hasChanges).toBe(true);

      const hostEntry = result.entries.find((e) => e.key === 'database.host');
      expect(hostEntry?.status).toBe('modified');
      expect(hostEntry?.stored).toBe('localhost');
      expect(hostEntry?.rendered).toBe('production-host');

      const timeoutEntry = result.entries.find((e) => e.key === 'api.timeout');
      expect(timeoutEntry?.status).toBe('modified');
    });

    it('should detect added values', async () => {
      // Jsonnet returns additional key not in stored
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
          api: { timeout: 30000, maxRetries: 3 },
        })
      );

      const result = await Effect.runPromise(
        executeDiff({
          service: 'api',
          config: defaultConfig,
        })
      );

      expect(result.hasChanges).toBe(true);

      const retriesEntry = result.entries.find((e) => e.key === 'api.maxRetries');
      expect(retriesEntry?.status).toBe('added');
      expect(retriesEntry?.stored).toBeUndefined();
      expect(retriesEntry?.rendered).toBe(3);
    });

    it('should detect removed values', async () => {
      // Jsonnet returns without some keys
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
          // api.timeout is missing
        })
      );

      const result = await Effect.runPromise(
        executeDiff({
          service: 'api',
          config: defaultConfig,
        })
      );

      expect(result.hasChanges).toBe(true);

      const timeoutEntry = result.entries.find((e) => e.key === 'api.timeout');
      expect(timeoutEntry?.status).toBe('removed');
      expect(timeoutEntry?.stored).toBe(30000);
      expect(timeoutEntry?.rendered).toBeUndefined();
    });

    it('should handle multiple sources', async () => {
      const sourceStorageKey = '/zenfig/shared/dev';
      const mockProviderWithSources = createMockProvider({
        '/zenfig/api/dev': {
          'database.host': 'localhost',
        },
        [sourceStorageKey]: {
          'database.port': '5432',
        },
      });

      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProviderWithSources));
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
        })
      );

      const result = await Effect.runPromise(
        executeDiff({
          service: 'api',
          sources: ['shared'],
          config: defaultConfig,
        })
      );

      // Should have entries from both services
      expect(result.entries.some((e) => e.key === 'database.host')).toBe(true);
      expect(result.entries.some((e) => e.key === 'database.port')).toBe(true);
    });
  });

  describe('runDiff', () => {
    it('should return true when there are changes', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'different-host', port: 5432 },
          api: { timeout: 30000 },
        })
      );

      const result = await Effect.runPromise(
        runDiff({
          service: 'api',
          config: defaultConfig,
        })
      );

      expect(result).toBe(true);
    });

    it('should return false when there are no changes', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
          api: { timeout: 30000 },
        })
      );

      const result = await Effect.runPromise(
        runDiff({
          service: 'api',
          config: defaultConfig,
        })
      );

      expect(result).toBe(false);
    });

    it('should output table format by default', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'different-host', port: 5432 },
          api: { timeout: 30000 },
        })
      );

      await Effect.runPromise(
        runDiff({
          service: 'api',
          config: defaultConfig,
        })
      );

      // Table format contains table characters
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should output JSON format when specified', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'different-host', port: 5432 },
          api: { timeout: 30000 },
        })
      );

      await Effect.runPromise(
        runDiff({
          service: 'api',
          format: 'json',
          config: defaultConfig,
        })
      );

      // Check JSON format was output
      const lastCall = consoleSpy.mock.calls[0]?.[0];
      expect(() => JSON.parse(lastCall)).not.toThrow();
    });
  });
});
