/**
 * Init Command Tests
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { executeInit, runInit } from './init.js';

// Mock schema loader
vi.mock('../schema/loader.js', () => ({
  loadSchemaWithDefaults: vi.fn(),
}));

import { loadSchemaWithDefaults } from '../schema/loader.js';

describe('Init Command', () => {
  let tempDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

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
      port: Type.Integer({ default: 5432 }),
    }),
    api: Type.Object({
      timeout: Type.Integer(),
      enabled: Type.Optional(Type.Boolean()),
    }),
  });

  beforeEach(() => {
    vi.resetAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenfig-init-test-'));
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());

    vi.mocked(loadSchemaWithDefaults).mockReturnValue(
      Effect.succeed({ schema: testSchema, schemaHash: 'sha256:abc' })
    );
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

  describe('executeInit', () => {
    it('should generate a Jsonnet template', async () => {
      const outputPath = path.join(tempDir, 'config.jsonnet');

      const result = await Effect.runPromise(
        executeInit({
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(result.created).toBe(true);
      expect(result.path).toBe(outputPath);
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should include secrets and env declarations', async () => {
      const outputPath = path.join(tempDir, 'config.jsonnet');

      await Effect.runPromise(
        executeInit({
          output: outputPath,
          config: defaultConfig,
        })
      );

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('local s = std.extVar("secrets")');
      expect(content).toContain('local env = std.extVar("env")');
    });

    it('should generate accessors for schema properties', async () => {
      const outputPath = path.join(tempDir, 'config.jsonnet');

      await Effect.runPromise(
        executeInit({
          output: outputPath,
          config: defaultConfig,
        })
      );

      const content = fs.readFileSync(outputPath, 'utf-8');
      expect(content).toContain('database:');
      expect(content).toContain('host:');
      expect(content).toContain('port:');
      expect(content).toContain('api:');
      expect(content).toContain('timeout:');
    });

    it('should not overwrite existing file without force', async () => {
      const outputPath = path.join(tempDir, 'existing.jsonnet');
      fs.writeFileSync(outputPath, 'existing content');

      const result = await Effect.runPromise(
        executeInit({
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(result.created).toBe(false);
      expect(fs.readFileSync(outputPath, 'utf-8')).toBe('existing content');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Output file already exists')
      );
    });

    it('should overwrite existing file with force flag', async () => {
      const outputPath = path.join(tempDir, 'existing.jsonnet');
      fs.writeFileSync(outputPath, 'existing content');

      const result = await Effect.runPromise(
        executeInit({
          output: outputPath,
          force: true,
          config: defaultConfig,
        })
      );

      expect(result.created).toBe(true);
      expect(fs.readFileSync(outputPath, 'utf-8')).not.toBe('existing content');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Overwriting existing file')
      );
    });

    it('should use default output path from config', async () => {
      const configJsonnet = path.join(tempDir, 'config.jsonnet');
      const config: ResolvedConfig = { ...defaultConfig, jsonnet: configJsonnet };

      const result = await Effect.runPromise(
        executeInit({
          config,
        })
      );

      expect(result.path).toBe(configJsonnet);
      expect(result.created).toBe(true);
    });

    it('should create output directory if it does not exist', async () => {
      const outputPath = path.join(tempDir, 'nested', 'dir', 'config.jsonnet');

      const result = await Effect.runPromise(
        executeInit({
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(result.created).toBe(true);
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should include default values when includeDefaults is true', async () => {
      const outputPath = path.join(tempDir, 'config.jsonnet');

      await Effect.runPromise(
        executeInit({
          output: outputPath,
          includeDefaults: true,
          config: defaultConfig,
        })
      );

      const content = fs.readFileSync(outputPath, 'utf-8');
      // Should have comments about defaults
      expect(content).toContain('std.get');
    });

    it('should handle optional properties', async () => {
      const outputPath = path.join(tempDir, 'config.jsonnet');

      await Effect.runPromise(
        executeInit({
          output: outputPath,
          config: defaultConfig,
        })
      );

      const content = fs.readFileSync(outputPath, 'utf-8');
      // Optional properties may have conditional logic
      expect(content).toContain('enabled');
    });
  });

  describe('runInit', () => {
    it('should return true when template is created', async () => {
      const outputPath = path.join(tempDir, 'config.jsonnet');

      const result = await Effect.runPromise(
        runInit({
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(result).toBe(true);
    });

    it('should return false when template is not created', async () => {
      const outputPath = path.join(tempDir, 'existing.jsonnet');
      fs.writeFileSync(outputPath, 'existing content');

      const result = await Effect.runPromise(
        runInit({
          output: outputPath,
          // No force flag
          config: defaultConfig,
        })
      );

      expect(result).toBe(false);
    });

    it('should print generated path on success', async () => {
      const outputPath = path.join(tempDir, 'config.jsonnet');

      await Effect.runPromise(
        runInit({
          output: outputPath,
          config: defaultConfig,
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated')
      );
    });
  });
});
