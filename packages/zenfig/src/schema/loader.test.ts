/**
 * Schema Loader Tests
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ErrorCode } from '../errors.js';
import { loadSchema, loadSchemaWithDefaults } from './loader.js';

describe('Schema Loader', () => {
  let tempDir: string;
  const createdFiles: Array<string> = [];

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenfig-loader-test-'));
  });

  afterEach(() => {
    for (const file of createdFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    createdFiles.length = 0;

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('fails for non-existent file', async () => {
    const exit = await Effect.runPromiseExit(loadSchema('/nonexistent/path/schema.ts', 'effect'));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
    }
  });

  it('loads Effect Schema from TypeScript file', async () => {
    const schemaContent = `
      import * as Schema from 'effect/Schema';
      export const ConfigSchema = Schema.Struct({
        database: Schema.Struct({
          host: Schema.String,
          port: Schema.Number,
        }),
      });
    `;

    const schemaPath = path.join(tempDir, 'schema.effect.ts');
    fs.writeFileSync(schemaPath, schemaContent);
    createdFiles.push(schemaPath);

    const result = await Effect.runPromise(loadSchema(schemaPath, 'effect'));

    expect(result.schema).toBeDefined();
    expect(result.schemaHash).toMatch(/^sha256:/);
    expect(result.adapter.name).toBe('effect');
  });

  it('loads Zod schema from TypeScript file', async () => {
    const schemaContent = `
      import { z } from 'zod';
      export const ConfigSchema = z.object({
        database: z.object({
          host: z.string(),
          port: z.number(),
        }),
      });
    `;

    const schemaPath = path.join(tempDir, 'schema.zod.ts');
    fs.writeFileSync(schemaPath, schemaContent);
    createdFiles.push(schemaPath);

    const result = await Effect.runPromise(loadSchema(schemaPath, 'zod'));

    expect(result.schema).toBeDefined();
    expect(result.schemaHash).toMatch(/^sha256:/);
    expect(result.adapter.name).toBe('zod');
  });

  it('fails when export not found', async () => {
    const schemaContent = `
      export const WrongExportName = {};
    `;

    const schemaPath = path.join(tempDir, 'schema.mjs');
    fs.writeFileSync(schemaPath, schemaContent);
    createdFiles.push(schemaPath);

    const exit = await Effect.runPromiseExit(loadSchema(schemaPath, 'effect'));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
    }
  });

  it('fails when export is wrong validator type', async () => {
    const schemaContent = `
      import * as Schema from 'effect/Schema';
      export const ConfigSchema = Schema.String;
    `;

    const schemaPath = path.join(tempDir, 'schema.invalid.ts');
    fs.writeFileSync(schemaPath, schemaContent);
    createdFiles.push(schemaPath);

    const exit = await Effect.runPromiseExit(loadSchema(schemaPath, 'zod'));

    expect(exit._tag).toBe('Failure');
    if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
      expect(exit.cause.error.context.code).toBe(ErrorCode.SYS001);
    }
  });

  it('loadSchemaWithDefaults uses defaults when not specified', async () => {
    const exit = await Effect.runPromiseExit(loadSchemaWithDefaults());

    expect(exit._tag).toBe('Failure');
  });
});
