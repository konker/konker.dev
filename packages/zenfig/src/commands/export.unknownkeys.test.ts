/**
 * Export Command Unknown Keys Tests
 */
import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { ErrorCode } from '../errors.js';
import { createMockProvider } from '../providers/MockProvider.js';

vi.mock('../schema/loader.js', () => ({
  loadSchemaWithDefaults: vi.fn(),
}));

vi.mock('../providers/registry.js', () => ({
  getProvider: vi.fn(),
}));

vi.mock('../schema/index.js', () => ({
  validate: vi.fn(),
}));

vi.mock('../schema/parser.js', () => ({
  parseProviderKV: vi.fn(),
}));

describe('Export Command Unknown Keys', () => {
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
    }),
  });

  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it('should warn on unknown keys when not strict', async () => {
    const { executeExport } = await import('./export.js');
    const { loadSchemaWithDefaults } = await import('../schema/loader.js');
    const { getProvider } = await import('../providers/registry.js');
    const { validate } = await import('../schema/index.js');
    const { parseProviderKV } = await import('../schema/parser.js');

    const mockProvider = createMockProvider({
      '/zenfig/dev/api': {
        'database.host': 'localhost',
        'unknown.key': 'oops',
      },
    });

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abc' }));
    vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));
    vi.mocked(validate).mockImplementation((value: unknown) => Effect.succeed(value));
    vi.mocked(parseProviderKV).mockReturnValue(
      Effect.succeed({
        parsed: { database: { host: 'localhost' } },
        unknownKeys: ['unknown.key'],
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
    const { executeExport } = await import('./export.js');
    const { loadSchemaWithDefaults } = await import('../schema/loader.js');
    const { getProvider } = await import('../providers/registry.js');
    const { validate } = await import('../schema/index.js');
    const { parseProviderKV } = await import('../schema/parser.js');

    const mockProvider = createMockProvider({
      '/zenfig/dev/api': {
        'database.host': 'localhost',
        'unknown.key': 'oops',
      },
    });

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abc' }));
    vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));
    vi.mocked(validate).mockImplementation((value: unknown) => Effect.succeed(value));
    vi.mocked(parseProviderKV).mockReturnValue(
      Effect.succeed({
        parsed: { database: { host: 'localhost' } },
        unknownKeys: ['unknown.key'],
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
});
