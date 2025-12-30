/**
 * Diff Command Unknown Keys Tests
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

vi.mock('../jsonnet/executor.js', () => ({
  evaluateTemplate: vi.fn(),
}));

vi.mock('../schema/parser.js', () => ({
  parseProviderKV: vi.fn(),
}));

describe('Diff Command Unknown Keys', () => {
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
    }),
  });

  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it('should warn on unknown keys when not strict', async () => {
    const { executeDiff } = await import('./diff.js');
    const { loadSchemaWithDefaults } = await import('../schema/loader.js');
    const { getProvider } = await import('../providers/registry.js');
    const { evaluateTemplate } = await import('../jsonnet/executor.js');
    const { parseProviderKV } = await import('../schema/parser.js');

    const mockProvider = createMockProvider({
      '/zenfig/dev/api': {
        'database.host': 'localhost',
        'unknown.key': 'oops',
      },
    });

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abc' }));
    vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));
    vi.mocked(evaluateTemplate).mockReturnValue(
      Effect.succeed({
        database: { host: 'localhost' },
      })
    );
    vi.mocked(parseProviderKV).mockReturnValue(
      Effect.succeed({
        parsed: { database: { host: 'localhost' } },
        unknownKeys: ['unknown.key'],
      })
    );

    const result = await Effect.runPromise(
      executeDiff({
        service: 'api',
        config: defaultConfig,
      })
    );

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should fail on unknown keys when strict', async () => {
    const { executeDiff } = await import('./diff.js');
    const { loadSchemaWithDefaults } = await import('../schema/loader.js');
    const { getProvider } = await import('../providers/registry.js');
    const { evaluateTemplate } = await import('../jsonnet/executor.js');
    const { parseProviderKV } = await import('../schema/parser.js');

    const mockProvider = createMockProvider({
      '/zenfig/dev/api': {
        'database.host': 'localhost',
        'unknown.key': 'oops',
      },
    });

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abc' }));
    vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));
    vi.mocked(evaluateTemplate).mockReturnValue(
      Effect.succeed({
        database: { host: 'localhost' },
      })
    );
    vi.mocked(parseProviderKV).mockReturnValue(
      Effect.succeed({
        parsed: { database: { host: 'localhost' } },
        unknownKeys: ['unknown.key'],
      })
    );

    const exit = await Effect.runPromiseExit(
      executeDiff({
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
