/**
 * Snapshot Command Tests
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createInterface } from 'node:readline';

import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { ErrorCode } from '../errors.js';
import { createMockProvider } from '../providers/MockProvider.js';
import { getProvider } from '../providers/registry.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { executeSnapshotRestore, executeSnapshotSave, runSnapshotRestore, runSnapshotSave } from './snapshot.js';

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

describe('Snapshot Commands', () => {
  let tempDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
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
      port: Type.Integer(),
    }),
  });

  beforeEach(() => {
    vi.resetAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenfig-snapshot-test-'));

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

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(
      Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abcdef1234567890' })
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

  describe('executeSnapshotSave', () => {
    it('should save snapshot to file', async () => {
      const outputPath = path.join(tempDir, 'snapshot.json');

      const result = await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(result.path).toBe(outputPath);
      expect(result.keyCount).toBe(2);
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should include metadata in snapshot', async () => {
      const outputPath = path.join(tempDir, 'snapshot.json');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: defaultConfig,
        })
      );

      const snapshot = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(snapshot.version).toBe(1);
      expect(snapshot.layer).toBe('stored');
      expect(snapshot.meta.env).toBe('dev');
      expect(snapshot.meta.provider).toBe('mock');
      expect(snapshot.meta.schemaHash).toMatch(/^sha256:/);
    });

    it('should store data per service', async () => {
      const outputPath = path.join(tempDir, 'snapshot.json');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: defaultConfig,
        })
      );

      const snapshot = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(snapshot.data.api).toBeDefined();
      expect(snapshot.data.api['database.host']).toBe('localhost');
    });

    it('should save multiple services when sources specified', async () => {
      const mockProviderWithSources = createMockProvider({
        '/zenfig/dev/api': {
          'database.host': 'localhost',
        },
        '/zenfig/dev/shared': {
          'database.port': '5432',
        },
      });

      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProviderWithSources));

      const outputPath = path.join(tempDir, 'snapshot.json');

      const result = await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          sources: ['shared'],
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(result.services).toEqual(['api', 'shared']);

      const snapshot = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(snapshot.data.api).toBeDefined();
      expect(snapshot.data.shared).toBeDefined();
    });

    it('should use default path when output not specified', async () => {
      // Create .zenfig/snapshots directory
      const snapshotsDir = path.join(tempDir, '.zenfig', 'snapshots');
      fs.mkdirSync(snapshotsDir, { recursive: true });

      // Change to temp dir for this test
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await Effect.runPromise(
          executeSnapshotSave({
            service: 'api',
            config: defaultConfig,
          })
        );

        expect(result.path).toContain('.zenfig/snapshots');
        expect(result.path).toContain('api-dev-');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should warn if not covered by gitignore', async () => {
      const outputPath = path.join(tempDir, 'snapshot.json');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should skip warning when .gitignore covers .zenfig', async () => {
      const outputPath = path.join(tempDir, 'snapshot.json');
      const gitignorePath = path.join(tempDir, '.gitignore');
      fs.writeFileSync(gitignorePath, '.zenfig\n');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should warn when .gitignore is unreadable', async () => {
      const outputPath = path.join(tempDir, 'snapshot.json');
      const gitignorePath = path.join(tempDir, '.gitignore');
      fs.writeFileSync(gitignorePath, '.zenfig/snapshots\n');
      fs.chmodSync(gitignorePath, 0o000);

      try {
        await Effect.runPromise(
          executeSnapshotSave({
            service: 'api',
            output: outputPath,
            config: defaultConfig,
          })
        );
      } finally {
        fs.chmodSync(gitignorePath, 0o600);
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should skip warning when .gitignore covers snapshots', async () => {
      const outputPath = path.join(tempDir, 'snapshot.json');
      const gitignorePath = path.join(tempDir, '.gitignore');
      fs.writeFileSync(gitignorePath, '.zenfig/snapshots\n');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should warn when default path is not covered by gitignore', async () => {
      const snapshotsDir = path.join(tempDir, '.zenfig', 'snapshots');
      fs.mkdirSync(snapshotsDir, { recursive: true });

      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        await Effect.runPromise(
          executeSnapshotSave({
            service: 'api',
            config: defaultConfig,
          })
        );
      } finally {
        process.chdir(originalCwd);
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should fail when snapshot directory cannot be created', async () => {
      const blockedPath = path.join(tempDir, 'no-dir');
      fs.writeFileSync(blockedPath, 'not-a-directory');

      const outputPath = path.join(blockedPath, 'snapshot.json');
      const exit = await Effect.runPromiseExit(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.SYS003);
      }
    });

    it('should fail when snapshot cannot be written', async () => {
      const readonlyDir = path.join(tempDir, 'readonly');
      fs.mkdirSync(readonlyDir, { recursive: true });
      fs.chmodSync(readonlyDir, 0o500);

      try {
        const outputPath = path.join(readonlyDir, 'snapshot.json');
        const exit = await Effect.runPromiseExit(
          executeSnapshotSave({
            service: 'api',
            output: outputPath,
            config: defaultConfig,
          })
        );

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.SYS003);
          }
        }
      } finally {
        fs.chmodSync(readonlyDir, 0o700);
      }
    });
  });

  describe('executeSnapshotRestore', () => {
    const createSnapshot = (data: Record<string, Record<string, string>>, schemaHash = 'sha256:abcdef1234567890') => ({
      version: 1,
      layer: 'stored',
      meta: {
        timestamp: new Date().toISOString(),
        env: 'dev',
        provider: 'mock',
        ssmPrefix: '/zenfig',
        schemaHash,
        services: Object.keys(data),
      },
      data,
    });

    it('should fail when snapshot file does not exist', async () => {
      const exit = await Effect.runPromiseExit(
        executeSnapshotRestore({
          snapshotFile: '/nonexistent/snapshot.json',
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS002);
        }
      }
    });

    it('should fail when snapshot JSON is invalid', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      fs.writeFileSync(snapshotPath, '{ invalid json');

      const exit = await Effect.runPromiseExit(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS002);
        }
      }
    });

    it('should fail when snapshot file cannot be read', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          'database.host': 'localhost',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));
      fs.chmodSync(snapshotPath, 0o000);

      try {
        const exit = await Effect.runPromiseExit(
          executeSnapshotRestore({
            snapshotFile: snapshotPath,
            config: defaultConfig,
          })
        );

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.SYS002);
          }
        }
      } finally {
        fs.chmodSync(snapshotPath, 0o600);
      }
    });

    it('should fail when snapshot version is unsupported', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = {
        version: 2,
        layer: 'stored',
        meta: {
          timestamp: new Date().toISOString(),
          env: 'dev',
          provider: 'mock',
          ssmPrefix: '/zenfig',
          schemaHash: 'sha256:abcdef1234567890',
          services: ['api'],
        },
        data: {
          api: { 'database.host': 'localhost' },
        },
      };

      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const exit = await Effect.runPromiseExit(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS002);
        }
      }
    });

    it('should detect no changes when data matches', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          'database.host': 'localhost',
          'database.port': '5432',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          dryRun: true,
          config: defaultConfig,
        })
      );

      expect(result.changes).toEqual([]);
      expect(result.applied).toBe(false);
    });

    it('should detect changes when data differs', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          'database.host': 'new-host',
          'database.port': '5432',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          dryRun: true,
          config: defaultConfig,
        })
      );

      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.changes.find((c) => c.key === 'database.host')?.action).toBe('update');
    });

    it('should detect new keys to add', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          'database.host': 'localhost',
          'database.port': '5432',
          'database.timeout': '30000', // New key
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          dryRun: true,
          config: defaultConfig,
        })
      );

      expect(result.changes.find((c) => c.key === 'database.timeout')?.action).toBe('add');
    });

    it('should not apply changes in dry run mode', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          'database.host': 'new-host',
          'database.port': '5432',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          dryRun: true,
          config: defaultConfig,
        })
      );

      expect(result.applied).toBe(false);

      // Verify data was not changed
      const stored = await Effect.runPromise(mockProvider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('localhost');
    });

    it('should apply changes with confirm flag', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          'database.host': 'new-host',
          'database.port': '5432',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          confirm: true,
          config: defaultConfig,
        })
      );

      expect(result.applied).toBe(true);

      // Verify data was changed
      const stored = await Effect.runPromise(mockProvider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('new-host');
    });

    it('should cancel restore when prompt declines', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          'database.host': 'new-host',
          'database.port': '5432',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          _testPromptOverride: () => Effect.succeed(false),
          config: defaultConfig,
        })
      );

      expect(result.applied).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Restore cancelled'));

      const stored = await Effect.runPromise(mockProvider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('localhost');
    });

    it('should use interactive prompt when no override is provided', async () => {
      vi.mocked(createInterface).mockReturnValueOnce({
        question: (_message: string, cb: (answer: string) => void) => cb('n'),
        close: vi.fn(),
      } as unknown as ReturnType<typeof createInterface>);

      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          'database.host': 'new-host',
          'database.port': '5432',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          config: defaultConfig,
        })
      );

      expect(result.applied).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Restore cancelled'));
    });

    it('should apply changes after prompt confirmation', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          'database.host': 'new-host',
          'database.port': '5432',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          _testPromptOverride: () => Effect.succeed(true),
          config: defaultConfig,
        })
      );

      expect(result.applied).toBe(true);

      const stored = await Effect.runPromise(mockProvider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('new-host');
    });

    it('should fail when schema hash does not match', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({ api: { 'database.host': 'localhost' } }, 'sha256:differenthash');
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const exit = await Effect.runPromiseExit(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS004);
        }
      }
    });

    it('should proceed with force flag when schema hash does not match', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot(
        { api: { 'database.host': 'localhost', 'database.port': '5432' } },
        'sha256:differenthash'
      );
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          forceSchemaMatch: true,
          dryRun: true,
          config: defaultConfig,
        })
      );

      expect(result.applied).toBe(false); // Dry run
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Schema has changed'));
    });

    it('should require confirm flag in CI mode', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: { 'database.host': 'new-host', 'database.port': '5432' },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const ciConfig: ResolvedConfig = { ...defaultConfig, ci: true };

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          // No confirm flag
          config: ciConfig,
        })
      );

      expect(result.applied).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('--confirm flag required in CI mode'));
    });
  });

  describe('runSnapshotSave', () => {
    it('should print summary on success', async () => {
      const outputPath = path.join(tempDir, 'snapshot.json');

      await Effect.runPromise(
        runSnapshotSave({
          service: 'api',
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Saved'));
    });
  });

  describe('runSnapshotRestore', () => {
    it('should return true when changes applied', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = {
        version: 1,
        layer: 'stored',
        meta: {
          timestamp: new Date().toISOString(),
          env: 'dev',
          provider: 'mock',
          ssmPrefix: '/zenfig',
          schemaHash: 'sha256:abcdef1234567890',
          services: ['api'],
        },
        data: {
          api: { 'database.host': 'new-host', 'database.port': '5432' },
        },
      };
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        runSnapshotRestore({
          snapshotFile: snapshotPath,
          confirm: true,
          config: defaultConfig,
        })
      );

      expect(result).toBe(true);
    });

    it('should return false when no changes applied', async () => {
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = {
        version: 1,
        layer: 'stored',
        meta: {
          timestamp: new Date().toISOString(),
          env: 'dev',
          provider: 'mock',
          ssmPrefix: '/zenfig',
          schemaHash: 'sha256:abcdef1234567890',
          services: ['api'],
        },
        data: {
          api: { 'database.host': 'localhost', 'database.port': '5432' },
        },
      };
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        runSnapshotRestore({
          snapshotFile: snapshotPath,
          confirm: true,
          config: defaultConfig,
        })
      );

      expect(result).toBe(false);
    });
  });
});
