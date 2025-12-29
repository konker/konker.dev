/**
 * Validate Command Tests
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { ErrorCode } from '../errors.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { parseProviderKV } from '../schema/parser.js';
import { executeValidate, runValidate } from './validate.js';

// Mock schema loader
vi.mock('../schema/loader.js', () => ({
  loadSchemaWithDefaults: vi.fn(),
}));

vi.mock('../schema/parser.js', async () => {
  const actual = (await vi.importActual('../schema/parser.js')) as { parseProviderKV: typeof parseProviderKV };
  return { ...actual, parseProviderKV: vi.fn(actual.parseProviderKV) };
});

describe('Validate Command', () => {
  let tempDir: string;
  const createdFiles: Array<string> = [];
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let actualParseProviderKV: typeof parseProviderKV;

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

  beforeEach(() => {
    vi.resetAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenfig-validate-test-'));
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    vi.mocked(parseProviderKV).mockImplementation(actualParseProviderKV);
  });

  beforeAll(async () => {
    const actual = (await vi.importActual('../schema/parser.js')) as { parseProviderKV: typeof parseProviderKV };
    actualParseProviderKV = actual.parseProviderKV;
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
          expect(cause.error.context.code).toBe(ErrorCode.SYS001);
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

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const jsonPath = path.join(tempDir, 'valid.json');
      fs.writeFileSync(jsonPath, JSON.stringify({ database: { host: 'localhost', port: 5432 } }));
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
      expect(result.warnings).toEqual([]);
    });

    it('should detect validation errors', async () => {
      const schema = Type.Object({
        database: Type.Object({
          port: Type.Integer(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const jsonPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(jsonPath, JSON.stringify({ database: { port: 'not-a-number' } }));
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
      expect(result.warnings).toEqual([]);
    });

    it('should validate ENV file format', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

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
      expect(result.warnings).toEqual([]);
    });

    it('should warn on unknown env keys when not strict', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const envPath = path.join(tempDir, 'config-unknown.env');
      fs.writeFileSync(envPath, 'DATABASE_HOST=localhost\nEXTRA_KEY=oops\n');
      createdFiles.push(envPath);

      const result = await Effect.runPromise(
        executeValidate({
          file: envPath,
          format: 'env',
          config: defaultConfig,
        })
      );

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should fail on unknown env keys in strict mode', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const envPath = path.join(tempDir, 'config-unknown-strict.env');
      fs.writeFileSync(envPath, 'DATABASE_HOST=localhost\nEXTRA_KEY=oops\n');
      createdFiles.push(envPath);

      const strictConfig: ResolvedConfig = { ...defaultConfig, strict: true };

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

    it('should fail when parsed env keys include unknown entries in strict mode', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const envPath = path.join(tempDir, 'config-strict.env');
      fs.writeFileSync(envPath, 'DATABASE_HOST=localhost\n');
      createdFiles.push(envPath);

      vi.mocked(parseProviderKV).mockReturnValueOnce(
        Effect.succeed({
          parsed: { database: { host: 'localhost' } },
          unknownKeys: ['extra.path'],
        })
      );

      const strictConfig: ResolvedConfig = { ...defaultConfig, strict: true };

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
      const schema = Type.Object({
        key: Type.String(),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

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

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

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
      expect(result.warnings).toEqual([]);
    });

    it('should fail on unknown keys in strict mode', async () => {
      const schema = Type.Object({
        key: Type.String(),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const jsonPath = path.join(tempDir, 'unknown-keys.json');
      fs.writeFileSync(jsonPath, JSON.stringify({ key: 'value', extra: 'nope' }));
      createdFiles.push(jsonPath);

      const strictConfig: ResolvedConfig = { ...defaultConfig, strict: true };

      const exit = await Effect.runPromiseExit(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: strictConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.VAL004);
        }
      }
    });

    it('should warn on unknown env keys when not strict', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const envPath = path.join(tempDir, 'unknown.env');
      fs.writeFileSync(envPath, 'DATABASE_HOST=localhost\nUNKNOWN_KEY=oops\n');
      createdFiles.push(envPath);

      const result = await Effect.runPromise(
        executeValidate({
          file: envPath,
          format: 'env',
          config: defaultConfig,
        })
      );

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should fail on unknown env keys in strict mode', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const envPath = path.join(tempDir, 'unknown-strict.env');
      fs.writeFileSync(envPath, 'DATABASE_HOST=localhost\nUNKNOWN_KEY=oops\n');
      createdFiles.push(envPath);

      const strictConfig: ResolvedConfig = { ...defaultConfig, strict: true };

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

    it('should fail when parsed env values contain unknown keys in strict mode', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const envPath = path.join(tempDir, 'unknown-parsed.env');
      fs.writeFileSync(envPath, 'DATABASE_HOST=localhost\n');
      createdFiles.push(envPath);

      vi.mocked(parseProviderKV).mockReturnValueOnce(
        Effect.succeed({
          parsed: { database: { host: 'localhost' } },
          unknownKeys: ['database.extra'],
        })
      );

      const strictConfig: ResolvedConfig = { ...defaultConfig, strict: true };

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

    it('should allow non-object JSON to skip unknown key checks', async () => {
      const schema = Type.Object({
        key: Type.String(),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const jsonPath = path.join(tempDir, 'array.json');
      fs.writeFileSync(jsonPath, JSON.stringify(['value']));
      createdFiles.push(jsonPath);

      const result = await Effect.runPromise(
        executeValidate({
          file: jsonPath,
          format: 'json',
          config: defaultConfig,
        })
      );

      expect(result.valid).toBe(false);
    });

    it('should fail when format cannot be detected', async () => {
      const textPath = path.join(tempDir, 'config.txt');
      fs.writeFileSync(textPath, 'foo=bar\n');
      createdFiles.push(textPath);

      const exit = await Effect.runPromiseExit(
        executeValidate({
          file: textPath,
          config: defaultConfig,
        })
      );

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS001);
        }
      }
    });

    it('should fail when file cannot be read', async () => {
      const jsonPath = path.join(tempDir, 'unreadable.json');
      fs.writeFileSync(jsonPath, JSON.stringify({ key: 'value' }));
      createdFiles.push(jsonPath);

      fs.chmodSync(jsonPath, 0o000);
      try {
        const exit = await Effect.runPromiseExit(
          executeValidate({
            file: jsonPath,
            format: 'json',
            config: defaultConfig,
          })
        );

        expect(exit._tag).toBe('Failure');
        if (exit._tag === 'Failure') {
          const cause = exit.cause;
          if (cause._tag === 'Fail') {
            expect(cause.error.context.code).toBe(ErrorCode.SYS001);
          }
        }
      } finally {
        fs.chmodSync(jsonPath, 0o600);
      }
    });
  });

  describe('runValidate', () => {
    it('should print success message for valid file', async () => {
      const schema = Type.Object({ key: Type.String() });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

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

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

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

    it('should print warnings when unknown keys are present', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
        }),
      });

      vi.mocked(loadSchemaWithDefaults).mockReturnValue(Effect.succeed({ schema, schemaHash: 'sha256:abc' }));

      const envPath = path.join(tempDir, 'warn.env');
      fs.writeFileSync(envPath, 'DATABASE_HOST=localhost\nEXTRA_KEY=oops\n');
      createdFiles.push(envPath);

      await Effect.runPromise(
        runValidate({
          file: envPath,
          format: 'env',
          config: defaultConfig,
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Warning'));
    });
  });
});
