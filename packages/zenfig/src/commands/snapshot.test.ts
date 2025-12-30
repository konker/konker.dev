/**
 * Snapshot Command Tests
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../errors.js';
import { loadSchema } from '../schema/loader.js';
import {
  basicProviderKv,
  createBasicProviderData,
  createTempDir,
  createTestConfig,
  registerMockProviderWithData,
  removeDir,
  schemaBasicPath,
} from '../test/fixtures/index.js';
import { executeSnapshotRestore, executeSnapshotSave, runSnapshotRestore, runSnapshotSave } from './snapshot.js';

describe('Snapshot Commands', () => {
  let tempDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let schemaHash = '';

  const baseConfig = createTestConfig({ schema: schemaBasicPath });
  const buildConfig = (provider: string) => ({
    ...baseConfig,
    provider,
  });

  const createSnapshot = (
    data: Record<string, Record<string, string>>,
    hashOverride: string | undefined = undefined
  ) => ({
    version: 1 as const,
    layer: 'stored' as const,
    meta: {
      timestamp: new Date().toISOString(),
      env: baseConfig.env,
      provider: 'mock',
      ssmPrefix: baseConfig.ssmPrefix,
      schemaHash: hashOverride ?? schemaHash,
      services: Object.keys(data),
    },
    data,
  });

  beforeAll(async () => {
    const result = await Effect.runPromise(loadSchema(schemaBasicPath, 'ConfigSchema'));
    schemaHash = result.schemaHash;
  });

  beforeEach(() => {
    tempDir = createTempDir('zenfig-snapshot-test-');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    removeDir(tempDir);
  });

  describe('executeSnapshotSave', () => {
    it('should save snapshot to file', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const outputPath = path.join(tempDir, 'snapshot.json');

      const result = await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: buildConfig(name),
        })
      );

      expect(result.path).toBe(outputPath);
      expect(result.keyCount).toBe(Object.keys(basicProviderKv).length);
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should include metadata in snapshot', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const outputPath = path.join(tempDir, 'snapshot.json');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: buildConfig(name),
        })
      );

      const snapshot = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(snapshot.version).toBe(1);
      expect(snapshot.layer).toBe('stored');
      expect(snapshot.meta.env).toBe('dev');
      expect(snapshot.meta.provider).toBe(name);
      expect(snapshot.meta.schemaHash).toBe(schemaHash);
    });

    it('should store data per service', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const outputPath = path.join(tempDir, 'snapshot.json');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: buildConfig(name),
        })
      );

      const snapshot = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(snapshot.data.api).toBeDefined();
      expect(snapshot.data.api['database.host']).toBe('localhost');
    });

    it('should save multiple services when sources specified', async () => {
      const { name } = registerMockProviderWithData({
        ...createBasicProviderData('api'),
        ...createBasicProviderData('shared', { 'database.host': 'shared-host' }),
      });
      const outputPath = path.join(tempDir, 'snapshot.json');

      const result = await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          sources: ['shared'],
          output: outputPath,
          config: buildConfig(name),
        })
      );

      expect(result.services).toEqual(['api', 'shared']);

      const snapshot = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(snapshot.data.api).toBeDefined();
      expect(snapshot.data.shared).toBeDefined();
    });

    it('should use default path when output not specified', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await Effect.runPromise(
          executeSnapshotSave({
            service: 'api',
            config: buildConfig(name),
          })
        );

        expect(result.path).toContain('.zenfig/snapshots');
        expect(result.path).toContain('api-dev-');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should warn if not covered by gitignore', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const outputPath = path.join(tempDir, 'snapshot.json');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: buildConfig(name),
        })
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should skip warning when .gitignore covers .zenfig', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const outputPath = path.join(tempDir, 'snapshot.json');
      const gitignorePath = path.join(tempDir, '.gitignore');
      fs.writeFileSync(gitignorePath, '.zenfig\n');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: buildConfig(name),
        })
      );

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should warn when .gitignore is unreadable', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const outputPath = path.join(tempDir, 'snapshot.json');
      const gitignorePath = path.join(tempDir, '.gitignore');
      fs.writeFileSync(gitignorePath, '.zenfig/snapshots\n');
      fs.chmodSync(gitignorePath, 0o000);

      try {
        await Effect.runPromise(
          executeSnapshotSave({
            service: 'api',
            output: outputPath,
            config: buildConfig(name),
          })
        );
      } finally {
        fs.chmodSync(gitignorePath, 0o600);
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should skip warning when .gitignore covers snapshots', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const outputPath = path.join(tempDir, 'snapshot.json');
      const gitignorePath = path.join(tempDir, '.gitignore');
      fs.writeFileSync(gitignorePath, '.zenfig/snapshots\n');

      await Effect.runPromise(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: buildConfig(name),
        })
      );

      expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should warn when default path is not covered by gitignore', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        await Effect.runPromise(
          executeSnapshotSave({
            service: 'api',
            config: buildConfig(name),
          })
        );
      } finally {
        process.chdir(originalCwd);
      }

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('.gitignore'));
    });

    it('should fail when snapshot directory cannot be created', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const blockedPath = path.join(tempDir, 'no-dir');
      fs.writeFileSync(blockedPath, 'not-a-directory');

      const outputPath = path.join(blockedPath, 'snapshot.json');
      const exit = await Effect.runPromiseExit(
        executeSnapshotSave({
          service: 'api',
          output: outputPath,
          config: buildConfig(name),
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.SYS002);
      }
    });

    it('should fail when snapshot cannot be written', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const readonlyDir = path.join(tempDir, 'readonly');
      fs.mkdirSync(readonlyDir, { recursive: true });
      fs.chmodSync(readonlyDir, 0o500);

      try {
        const outputPath = path.join(readonlyDir, 'snapshot.json');
        const exit = await Effect.runPromiseExit(
          executeSnapshotSave({
            service: 'api',
            output: outputPath,
            config: buildConfig(name),
          })
        );

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
          expect(exit.cause.error.context.code).toBe(ErrorCode.SYS002);
        }
      } finally {
        fs.chmodSync(readonlyDir, 0o700);
      }
    });
  });

  describe('executeSnapshotRestore', () => {
    it('should fail when snapshot file does not exist', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      const exit = await Effect.runPromiseExit(
        executeSnapshotRestore({
          snapshotFile: '/nonexistent/snapshot.json',
          config: buildConfig(name),
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
      }
    });

    it('should fail when snapshot JSON is invalid', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      fs.writeFileSync(snapshotPath, '{ invalid json');

      const exit = await Effect.runPromiseExit(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          config: buildConfig(name),
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
      }
    });

    it('should fail when snapshot file cannot be read', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
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
            config: buildConfig(name),
          })
        );

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
          expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
        }
      } finally {
        fs.chmodSync(snapshotPath, 0o600);
      }
    });

    it('should fail when snapshot version is unsupported', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = {
        version: 2,
        layer: 'stored',
        meta: {
          timestamp: new Date().toISOString(),
          env: 'dev',
          provider: 'mock',
          ssmPrefix: '/zenfig',
          schemaHash,
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
          config: buildConfig(name),
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
      }
    });

    it('should detect no changes when data matches', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          dryRun: true,
          config: buildConfig(name),
        })
      );

      expect(result.changes).toEqual([]);
      expect(result.applied).toBe(false);
    });

    it('should detect changes when data differs', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
          'database.host': 'new-host',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          dryRun: true,
          config: buildConfig(name),
        })
      );

      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.changes.find((change) => change.key === 'database.host')?.action).toBe('update');
    });

    it('should detect new keys to add', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
          'database.timeout': '30000',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          dryRun: true,
          config: buildConfig(name),
        })
      );

      expect(result.changes.find((change) => change.key === 'database.timeout')?.action).toBe('add');
    });

    it('should not apply changes in dry run mode', async () => {
      const { name, provider } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
          'database.host': 'new-host',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          dryRun: true,
          config: buildConfig(name),
        })
      );

      expect(result.applied).toBe(false);

      const stored = await Effect.runPromise(provider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('localhost');
    });

    it('should apply changes with confirm flag', async () => {
      const { name, provider } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
          'database.host': 'new-host',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          confirm: true,
          config: buildConfig(name),
        })
      );

      expect(result.applied).toBe(true);

      const stored = await Effect.runPromise(provider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('new-host');
    });

    it('should cancel restore when prompt declines', async () => {
      const { name, provider } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
          'database.host': 'new-host',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          _testPromptOverride: () => Effect.succeed(false),
          config: buildConfig(name),
        })
      );

      expect(result.applied).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Restore cancelled'));

      const stored = await Effect.runPromise(provider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('localhost');
    });

    it('should apply changes after prompt confirmation', async () => {
      const { name, provider } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
          'database.host': 'new-host',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          _testPromptOverride: () => Effect.succeed(true),
          config: buildConfig(name),
        })
      );

      expect(result.applied).toBe(true);

      const stored = await Effect.runPromise(provider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('new-host');
    });

    it('should fail when schema hash does not match', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({ api: { 'database.host': 'localhost' } }, 'sha256:differenthash');
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const exit = await Effect.runPromiseExit(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          config: buildConfig(name),
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.SYS003);
      }
    });

    it('should proceed with force flag when schema hash does not match', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({ api: { 'database.host': 'localhost' } }, 'sha256:differenthash');
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          forceSchemaMatch: true,
          dryRun: true,
          config: buildConfig(name),
        })
      );

      expect(result.applied).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Schema has changed'));
    });

    it('should require confirm flag in CI mode', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
          'database.host': 'new-host',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        executeSnapshotRestore({
          snapshotFile: snapshotPath,
          config: { ...buildConfig(name), ci: true },
        })
      );

      expect(result.applied).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('--confirm flag required in CI mode'));
    });
  });

  describe('runSnapshotSave', () => {
    it('should print summary on success', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const outputPath = path.join(tempDir, 'snapshot.json');

      await Effect.runPromise(
        runSnapshotSave({
          service: 'api',
          output: outputPath,
          config: buildConfig(name),
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Saved'));
    });
  });

  describe('runSnapshotRestore', () => {
    it('should return true when changes applied', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
          'database.host': 'new-host',
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        runSnapshotRestore({
          snapshotFile: snapshotPath,
          confirm: true,
          config: buildConfig(name),
        })
      );

      expect(result).toBe(true);
    });

    it('should return false when no changes applied', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const snapshotPath = path.join(tempDir, 'snapshot.json');
      const snapshot = createSnapshot({
        api: {
          ...basicProviderKv,
        },
      });
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot));

      const result = await Effect.runPromise(
        runSnapshotRestore({
          snapshotFile: snapshotPath,
          confirm: true,
          config: buildConfig(name),
        })
      );

      expect(result).toBe(false);
    });
  });
});
