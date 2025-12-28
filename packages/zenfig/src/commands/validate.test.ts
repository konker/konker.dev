/**
 * Validate Command Tests
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { ErrorCode } from '../errors.js';
import { executeValidate, runValidate } from './validate.js';

// Mock schema loader
vi.mock('../schema/loader.js', () => ({
  loadSchemaWithDefaults: vi.fn(),
}));

import { loadSchemaWithDefaults } from '../schema/loader.js';
import { Type } from '@sinclair/typebox';

describe('Validate Command', () => {
  let tempDir: string;
  const createdFiles: Array<string> = [];
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

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

  beforeEach(() => {
    vi.resetAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenfig-validate-test-'));
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();

    // Clean up temp files
    for (const file of createdFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch {
        // Ignore
      }
    }
    createdFiles.length = 0;

    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('executeValidate', () => {
    it('should fail when file does not exist', async () => {
      const exit = await Effect.runPromiseExit(
        executeValidate({
          file: '/nonexistent/file.json',
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

    it('should validate valid JSON file', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
          port: Type.Integer(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(
        Effect.succeed({ schema, schemaHash: 'sha256:abc' })
      );

      const jsonPath = path.join(tempDir, 'valid.json');
      fs.writeFileSync(
        jsonPath,
        JSON.stringify({ database: { host: 'localhost', port: 5432 } })
      );
      createdFiles.push(jsonPath);

      const result = await Effect.runPromise(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: defaultConfig,
        })
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect validation errors', async () => {
      const schema = Type.Object({
        database: Type.Object({
          port: Type.Integer(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(
        Effect.succeed({ schema, schemaHash: 'sha256:abc' })
      );

      const jsonPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(
        jsonPath,
        JSON.stringify({ database: { port: 'not-a-number' } })
      );
      createdFiles.push(jsonPath);

      const result = await Effect.runPromise(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: defaultConfig,
        })
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate ENV file format', async () => {
      // ENV file parsing keeps keys as-is (no conversion to nested objects)
      // So DATABASE_HOST stays as DATABASE_HOST, not database.host
      const schema = Type.Object({
        DATABASE_HOST: Type.String(),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(
        Effect.succeed({ schema, schemaHash: 'sha256:abc' })
      );

      const envPath = path.join(tempDir, 'config.env');
      fs.writeFileSync(envPath, 'DATABASE_HOST=localhost\n');
      createdFiles.push(envPath);

      const result = await Effect.runPromise(
        executeValidate({
          file: envPath,
          format: 'env',
          config: defaultConfig,
        })
      );

      expect(result.valid).toBe(true);
    });

    it('should fail for invalid JSON', async () => {
      const jsonPath = path.join(tempDir, 'invalid-json.json');
      fs.writeFileSync(jsonPath, 'not valid json {{{');
      createdFiles.push(jsonPath);

      const exit = await Effect.runPromiseExit(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
    });

    it('should auto-detect format', async () => {
      const schema = Type.Object({
        key: Type.String(),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(
        Effect.succeed({ schema, schemaHash: 'sha256:abc' })
      );

      const jsonPath = path.join(tempDir, 'config.json');
      fs.writeFileSync(jsonPath, JSON.stringify({ key: 'value' }));
      createdFiles.push(jsonPath);

      const result = await Effect.runPromise(
        executeValidate({
          file: jsonPath,
          // No format specified - should auto-detect
          config: defaultConfig,
        })
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('runValidate', () => {
    it('should print success message for valid file', async () => {
      const schema = Type.Object({ key: Type.String() });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(
        Effect.succeed({ schema, schemaHash: 'sha256:abc' })
      );

      const jsonPath = path.join(tempDir, 'valid.json');
      fs.writeFileSync(jsonPath, JSON.stringify({ key: 'value' }));
      createdFiles.push(jsonPath);

      const result = await Effect.runPromise(
        runValidate({
          file: jsonPath,
          format: 'json',
          config: defaultConfig,
        })
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Validation passed'));
    });

    it('should print error message for invalid file', async () => {
      const schema = Type.Object({ required: Type.String() });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(
        Effect.succeed({ schema, schemaHash: 'sha256:abc' })
      );

      const jsonPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(jsonPath, JSON.stringify({}));
      createdFiles.push(jsonPath);

      const result = await Effect.runPromise(
        runValidate({
          file: jsonPath,
          format: 'json',
          config: defaultConfig,
        })
      );

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
    });
  });
});
