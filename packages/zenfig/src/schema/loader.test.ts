/**
 * Schema Loader Tests
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../errors.js';
import { computeSchemaHash, loadSchema, loadSchemaWithDefaults } from './loader.js';

describe('Schema Loader', () => {
  let tempDir: string;
  const createdFiles: Array<string> = [];

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenfig-loader-test-'));
  });

  afterEach(() => {
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

  describe('computeSchemaHash', () => {
    it('should compute SHA-256 hash of schema', () => {
      const schema = Type.Object({ name: Type.String() });
      const hash = computeSchemaHash(schema);

      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should return same hash for same schema', () => {
      const schema1 = Type.Object({ name: Type.String() });
      const schema2 = Type.Object({ name: Type.String() });

      const hash1 = computeSchemaHash(schema1);
      const hash2 = computeSchemaHash(schema2);

      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different schemas', () => {
      const schema1 = Type.Object({ name: Type.String() });
      const schema2 = Type.Object({ age: Type.Integer() });

      const hash1 = computeSchemaHash(schema1);
      const hash2 = computeSchemaHash(schema2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('loadSchema', () => {
    it('should fail for non-existent file', async () => {
      const exit = await Effect.runPromiseExit(loadSchema('/nonexistent/path/schema.ts'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS002);
        }
      }
    });

    it('should load schema from valid TypeScript file', async () => {
      // Create a temp schema file
      const schemaContent = `
        import { Type } from '@sinclair/typebox';
        export const ConfigSchema = Type.Object({
          database: Type.Object({
            host: Type.String(),
            port: Type.Integer(),
          }),
        });
      `;

      const schemaPath = path.join(tempDir, 'schema.ts');
      fs.writeFileSync(schemaPath, schemaContent);
      createdFiles.push(schemaPath);

      // Note: In vitest with proper TypeScript support, .ts files can be dynamically imported
      const result = await Effect.runPromise(loadSchema(schemaPath));

      // loadSchema returns { schema, schemaHash }
      expect(result).toBeDefined();
      expect(result.schema).toBeDefined();
      expect(result.schemaHash).toMatch(/^sha256:/);
      // TypeBox schemas have a 'type' property
      expect(result.schema.type).toBe('object');
    });

    it('should fail when export not found', async () => {
      // Create a temp JS file with a different export name
      const schemaContent = `
        export const WrongExportName = { type: 'object' };
      `;

      const schemaPath = path.join(tempDir, 'schema.mjs');
      fs.writeFileSync(schemaPath, schemaContent);
      createdFiles.push(schemaPath);

      const exit = await Effect.runPromiseExit(loadSchema(schemaPath, 'ConfigSchema'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS002);
        }
      }
    });

    it('should fail when export is not a TypeBox schema', async () => {
      // Create a temp JS file with invalid schema (no 'type' property)
      const schemaContent = `
        export const ConfigSchema = { notASchema: true };
      `;

      const schemaPath = path.join(tempDir, 'invalid-schema.mjs');
      fs.writeFileSync(schemaPath, schemaContent);
      createdFiles.push(schemaPath);

      const exit = await Effect.runPromiseExit(loadSchema(schemaPath, 'ConfigSchema'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.SYS002);
        }
      }
    });

    it('should use custom export name', async () => {
      // Create a temp JS file with custom export
      const schemaContent = `
        export const MyCustomSchema = { type: 'object', properties: {} };
      `;

      const schemaPath = path.join(tempDir, 'custom-schema.mjs');
      fs.writeFileSync(schemaPath, schemaContent);
      createdFiles.push(schemaPath);

      const result = await Effect.runPromise(loadSchema(schemaPath, 'MyCustomSchema'));

      expect(result.schema).toBeDefined();
      expect(result.schemaHash).toMatch(/^sha256:/);
    });
  });

  describe('loadSchemaWithDefaults', () => {
    it('should use default path when not specified', async () => {
      const exit = await Effect.runPromiseExit(loadSchemaWithDefaults());

      // Will fail because src/schema.ts doesn't exist in test context
      expect(exit._tag).toBe('Failure');
    });

    it('should use provided path', async () => {
      const schemaContent = `
        export const ConfigSchema = { type: 'object', properties: {} };
      `;

      const schemaPath = path.join(tempDir, 'my-schema.mjs');
      fs.writeFileSync(schemaPath, schemaContent);
      createdFiles.push(schemaPath);

      const result = await Effect.runPromise(loadSchemaWithDefaults(schemaPath));

      expect(result.schema).toBeDefined();
    });

    it('should use provided export name', async () => {
      const schemaContent = `
        export const CustomExport = { type: 'object', properties: {} };
      `;

      const schemaPath = path.join(tempDir, 'export-schema.mjs');
      fs.writeFileSync(schemaPath, schemaContent);
      createdFiles.push(schemaPath);

      const result = await Effect.runPromise(loadSchemaWithDefaults(schemaPath, 'CustomExport'));

      expect(result.schema).toBeDefined();
    });
  });
});
