/**
 * Export Command Tests
 */
import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { ErrorCode, ValidationError } from '../errors.js';
import { evaluateTemplate } from '../jsonnet/executor.js';
import { createMockProvider } from '../providers/MockProvider.js';
import { getProvider } from '../providers/registry.js';
import { validate } from '../schema/index.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { parseProviderKV } from '../schema/parser.js';
import { executeExport, runExport } from './export.js';

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

vi.mock('../schema/validator.js', () => ({
  validate: vi.fn(),
}));

vi.mock('../schema/parser.js', async () => {
  const actual = (await vi.importActual('../schema/parser.js')) as { parseProviderKV: typeof parseProviderKV };
  return { ...actual, parseProviderKV: vi.fn(actual.parseProviderKV) };
});

describe('Export Command', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;
  let mockProvider: ReturnType<typeof createMockProvider>;
  let actualParseProviderKV: typeof parseProviderKV;

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

    const storageKey = '/zenfig/dev/api';
    mockProvider = createMockProvider({
      [storageKey]: {
        'database.host': 'localhost',
        'database.port': '5432',
        'api.timeout': '30000',
      },
    });

    vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(vi.fn());

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abc' }));
    vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));
    vi.mocked(parseProviderKV).mockImplementation(actualParseProviderKV);

    // Default: validate just passes through the value
    vi.mocked(validate).mockImplementation((value: unknown) => Effect.succeed(value));
  });

  beforeAll(async () => {
    const actual = (await vi.importActual('../schema/parser.js')) as { parseProviderKV: typeof parseProviderKV };
    actualParseProviderKV = actual.parseProviderKV;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeExport', () => {
    it('should export configuration from provider', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
          api: { timeout: 30000 },
        })
      );

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: defaultConfig,
        })
      );

      expect(result.config).toEqual({
        database: { host: 'localhost', port: 5432 },
        api: { timeout: 30000 },
      });
    });

    it('should format output as env', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
        })
      );

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: { ...defaultConfig, format: 'env' },
        })
      );

      expect(result.formatted).toContain('DATABASE_HOST=localhost');
      expect(result.formatted).toContain('DATABASE_PORT=5432');
    });

    it('should format output as JSON', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
        })
      );

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: { ...defaultConfig, format: 'json' },
        })
      );

      const parsed = JSON.parse(result.formatted);
      expect(parsed.database.host).toBe('localhost');
      expect(parsed.database.port).toBe(5432);
    });

    it('should merge multiple sources', async () => {
      const mockProviderWithSources = createMockProvider({
        '/zenfig/dev/api': {
          'database.host': 'api-host',
        },
        '/zenfig/dev/shared': {
          'database.port': '5432',
        },
      });

      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProviderWithSources));
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'api-host', port: 5432 },
        })
      );

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          sources: ['shared'],
          config: defaultConfig,
        })
      );

      expect(result.config).toEqual({
        database: { host: 'api-host', port: 5432 },
      });
    });

    it('should detect merge conflicts', async () => {
      const mockProviderWithConflicts = createMockProvider({
        '/zenfig/dev/api': {
          'database.host': 'api-host',
        },
        '/zenfig/dev/shared': {
          'database.host': 'shared-host', // Same key, different value
        },
      });

      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProviderWithConflicts));
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'api-host' },
        })
      );

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          sources: ['shared'],
          warnOnOverride: true,
          config: defaultConfig,
        })
      );

      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate output against schema', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 'not-a-number' },
          api: { timeout: 30000 },
        })
      );

      // Mock validation failure
      vi.mocked(validate).mockReturnValue(Effect.fail(new ValidationError({ message: 'Validation failed' } as never)));

      const exit = await Effect.runPromiseExit(
        executeExport({
          service: 'api',
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
    });

    it('should warn on unknown keys when not strict', async () => {
      const mockProviderWithUnknown = createMockProvider({
        '/zenfig/dev/api': {
          'database.host': 'localhost',
          'unknown.key': 'oops',
        },
      });

      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProviderWithUnknown));
      vi.mocked(parseProviderKV).mockReturnValueOnce(
        Effect.succeed({
          parsed: { database: { host: 'localhost' } },
          unknownKeys: ['unknown.key'],
        })
      );
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
          api: { timeout: 30000 },
        })
      );

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: defaultConfig,
        })
      );

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should fail on unknown keys in strict mode', async () => {
      const mockProviderWithUnknown = createMockProvider({
        '/zenfig/dev/api': {
          'database.host': 'localhost',
          'unknown.key': 'oops',
        },
      });

      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProviderWithUnknown));
      vi.mocked(parseProviderKV).mockReturnValueOnce(
        Effect.succeed({
          parsed: { database: { host: 'localhost' } },
          unknownKeys: ['unknown.key'],
        })
      );
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
          api: { timeout: 30000 },
        })
      );

      const exit = await Effect.runPromiseExit(
        executeExport({
          service: 'api',
          config: { ...defaultConfig, strict: true },
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail' && 'context' in exit.cause.error) {
        expect(exit.cause.error.context.code).toBe(ErrorCode.VAL004);
      }
    });

    it('should use custom separator', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost' },
        })
      );

      const result = await Effect.runPromise(
        executeExport({
          service: 'api',
          config: { ...defaultConfig, format: 'env', separator: '__' },
        })
      );

      expect(result.formatted).toContain('DATABASE__HOST=localhost');
    });
  });

  describe('runExport', () => {
    it('should write formatted output to stdout', async () => {
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'localhost', port: 5432 },
        })
      );

      await Effect.runPromise(
        runExport({
          service: 'api',
          config: { ...defaultConfig, format: 'json' },
        })
      );

      expect(stdoutWriteSpy).toHaveBeenCalled();
      const output = stdoutWriteSpy.mock.calls[0]?.[0];
      expect(JSON.parse(output)).toEqual({
        database: { host: 'localhost', port: 5432 },
      });
    });

    it('should print warnings to stderr', async () => {
      const mockProviderWithConflicts = createMockProvider({
        '/zenfig/dev/api': {
          'database.host': 'api-host',
        },
        '/zenfig/dev/shared': {
          'database.host': 'shared-host',
        },
      });

      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProviderWithConflicts));
      vi.mocked(evaluateTemplate).mockReturnValue(
        Effect.succeed({
          database: { host: 'api-host' },
        })
      );

      await Effect.runPromise(
        runExport({
          service: 'api',
          sources: ['shared'],
          warnOnOverride: true,
          config: defaultConfig,
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Warning'));
    });
  });
});
