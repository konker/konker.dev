/**
 * Validate Command Tests
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { ErrorCode } from '../errors.js';
import {
  basicEnvContent,
  basicParsedConfig,
  createTempDir,
  createTestConfig,
  removeDir,
  schemaBasicPath,
  writeFile,
  writeJson,
} from '../test/fixtures/index.js';
import { executeValidate, runValidate } from './validate.js';

describe('Validate Command', () => {
  let tempDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const baseConfig: ResolvedConfig = createTestConfig({ schema: schemaBasicPath });

  beforeEach(() => {
    tempDir = createTempDir('config-o-tron-validate-test-');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    removeDir(tempDir);
  });

  describe('executeValidate', () => {
    it('should fail when file does not exist', async () => {
      const exit = await Effect.runPromiseExit(
        executeValidate({
          file: '/nonexistent/file.json',
          config: baseConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
      }
    });

    it('should validate valid JSON file', async () => {
      const jsonPath = path.join(tempDir, 'valid.json');
      writeJson(jsonPath, basicParsedConfig);

      const result = await Effect.runPromise(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: baseConfig,
        })
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should detect validation errors', async () => {
      const jsonPath = path.join(tempDir, 'invalid.json');
      writeJson(jsonPath, {
        ...basicParsedConfig,
        database: { ...basicParsedConfig.database, port: 'not-a-number' },
      });

      const result = await Effect.runPromise(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: baseConfig,
        })
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
    });

    it('should validate ENV file format', async () => {
      const envPath = path.join(tempDir, 'config.env');
      writeFile(envPath, `${basicEnvContent}\n`);

      const result = await Effect.runPromise(
        executeValidate({
          file: envPath,
          format: 'env',
          config: baseConfig,
        })
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('should warn on unknown env keys when not strict', async () => {
      const envPath = path.join(tempDir, 'config-unknown.env');
      writeFile(envPath, `${basicEnvContent}\nEXTRA_KEY=oops\n`);

      const result = await Effect.runPromise(
        executeValidate({
          file: envPath,
          format: 'env',
          config: baseConfig,
        })
      );

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should fail on unknown env keys in strict mode', async () => {
      const envPath = path.join(tempDir, 'config-unknown-strict.env');
      writeFile(envPath, `${basicEnvContent}\nEXTRA_KEY=oops\n`);

      const strictConfig: ResolvedConfig = { ...baseConfig, strict: true };

      const exit = await Effect.runPromiseExit(
        executeValidate({
          file: envPath,
          format: 'env',
          config: strictConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.VAL004);
      }
    });

    it('should fail for invalid JSON', async () => {
      const jsonPath = path.join(tempDir, 'invalid-json.json');
      writeFile(jsonPath, 'not valid json {{{');

      const exit = await Effect.runPromiseExit(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: baseConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
    });

    it('should auto-detect format', async () => {
      const jsonPath = path.join(tempDir, 'config.json');
      writeJson(jsonPath, basicParsedConfig);

      const result = await Effect.runPromise(
        executeValidate({
          file: jsonPath,
          config: baseConfig,
        })
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('should fail on unknown keys in strict mode', async () => {
      const jsonPath = path.join(tempDir, 'unknown-keys.json');
      writeJson(jsonPath, { ...basicParsedConfig, extra: 'nope' });

      const strictConfig: ResolvedConfig = { ...baseConfig, strict: true };

      const exit = await Effect.runPromiseExit(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: strictConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.VAL004);
      }
    });

    it('should allow non-object JSON to skip unknown key checks', async () => {
      const jsonPath = path.join(tempDir, 'array.json');
      writeJson(jsonPath, ['value']);

      const result = await Effect.runPromise(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: baseConfig,
        })
      );

      expect(result.valid).toBe(false);
    });

    it('should fail when format cannot be detected', async () => {
      const textPath = path.join(tempDir, 'config.txt');
      writeFile(textPath, 'foo=bar\n');

      const exit = await Effect.runPromiseExit(
        executeValidate({
          file: textPath,
          config: baseConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
        expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
      }
    });

    it('should fail when file cannot be read', async () => {
      const jsonPath = path.join(tempDir, 'unreadable.json');
      writeJson(jsonPath, basicParsedConfig);

      fs.chmodSync(jsonPath, 0o000);
      try {
        const exit = await Effect.runPromiseExit(
          executeValidate({
            file: jsonPath,
            format: 'json',
            config: baseConfig,
          })
        );

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
          expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
        }
      } finally {
        fs.chmodSync(jsonPath, 0o600);
      }
    });
  });

  describe('runValidate', () => {
    it('should print success message for valid file', async () => {
      const jsonPath = path.join(tempDir, 'valid.json');
      writeJson(jsonPath, basicParsedConfig);

      const result = await Effect.runPromise(
        runValidate({
          file: jsonPath,
          format: 'json',
          config: baseConfig,
        })
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Validation passed'));
    });

    it('should print error message for invalid file', async () => {
      const jsonPath = path.join(tempDir, 'invalid.json');
      writeJson(jsonPath, {});

      const result = await Effect.runPromise(
        runValidate({
          file: jsonPath,
          format: 'json',
          config: baseConfig,
        })
      );

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
    });

    it('should print warnings when unknown keys are present', async () => {
      const envPath = path.join(tempDir, 'warn.env');
      writeFile(envPath, `${basicEnvContent}\nEXTRA_KEY=oops\n`);

      await Effect.runPromise(
        runValidate({
          file: envPath,
          format: 'env',
          config: baseConfig,
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Warning'));
    });
  });
});
