/**
 * Doctor Command Tests
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { executeDoctor, runDoctor } from './doctor.js';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

// Mock schema loader
vi.mock('../schema/loader.js', () => ({
  loadSchemaWithDefaults: vi.fn(),
}));

import { execa } from 'execa';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { Type } from '@sinclair/typebox';

describe('Doctor Command', () => {
  let tempDir: string;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

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
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zenfig-doctor-test-'));
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());

    // Default mock for execa - all binaries found
    vi.mocked(execa).mockImplementation((cmd, args) => {
      if (cmd === 'which') {
        return Promise.resolve({ stdout: `/usr/bin/${args?.[0]}`, stderr: '' }) as never;
      }
      if (args?.[0] === '--version') {
        return Promise.resolve({ stdout: `${cmd} version 1.0.0`, stderr: '' }) as never;
      }
      return Promise.resolve({ stdout: '', stderr: '' }) as never;
    });

    // Default mock for schema loader
    const schema = Type.Object({ key: Type.String() });
    vi.mocked(loadSchemaWithDefaults).mockReturnValue(
      Effect.succeed({ schema, schemaHash: 'sha256:abcdef1234567890' })
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

  describe('executeDoctor', () => {
    it('should check jsonnet binary', async () => {
      const config: ResolvedConfig = {
        ...defaultConfig,
        schema: path.join(tempDir, 'schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      // Create required files
      fs.writeFileSync(config.schema, 'export const ConfigSchema = {}');
      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(executeDoctor({ config }));

      expect(result.checks.some((c) => c.name === 'Binary: jsonnet')).toBe(true);
    });

    it('should check chamber binary when provider is chamber', async () => {
      const config: ResolvedConfig = {
        ...defaultConfig,
        provider: 'chamber',
        schema: path.join(tempDir, 'schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      // Create required files
      fs.writeFileSync(config.schema, 'export const ConfigSchema = {}');
      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(executeDoctor({ config }));

      expect(result.checks.some((c) => c.name === 'Binary: chamber')).toBe(true);
    });

    it('should not check chamber binary when provider is mock', async () => {
      const config: ResolvedConfig = {
        ...defaultConfig,
        provider: 'mock',
        schema: path.join(tempDir, 'schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      // Create required files
      fs.writeFileSync(config.schema, 'export const ConfigSchema = {}');
      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(executeDoctor({ config }));

      expect(result.checks.some((c) => c.name === 'Binary: chamber')).toBe(false);
    });

    it('should report error when binary not found', async () => {
      vi.mocked(execa).mockImplementation((cmd, args) => {
        if (cmd === 'which') {
          throw new Error('not found');
        }
        return Promise.resolve({ stdout: '', stderr: '' }) as never;
      });

      const config: ResolvedConfig = {
        ...defaultConfig,
        schema: path.join(tempDir, 'schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      // Create required files
      fs.writeFileSync(config.schema, 'export const ConfigSchema = {}');
      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(executeDoctor({ config }));

      const jsonnetCheck = result.checks.find((c) => c.name === 'Binary: jsonnet');
      expect(jsonnetCheck?.status).toBe('error');
      expect(result.allPassed).toBe(false);
    });

    it('should check schema file exists', async () => {
      const config: ResolvedConfig = {
        ...defaultConfig,
        schema: path.join(tempDir, 'schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      // Create required files
      fs.writeFileSync(config.schema, 'export const ConfigSchema = {}');
      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(executeDoctor({ config }));

      const schemaCheck = result.checks.find((c) => c.name === 'File: Schema file');
      expect(schemaCheck?.status).toBe('ok');
    });

    it('should report error when schema file missing', async () => {
      const config: ResolvedConfig = {
        ...defaultConfig,
        schema: path.join(tempDir, 'nonexistent-schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(executeDoctor({ config }));

      const schemaCheck = result.checks.find((c) => c.name === 'File: Schema file');
      expect(schemaCheck?.status).toBe('error');
    });

    it('should check jsonnet file exists', async () => {
      const config: ResolvedConfig = {
        ...defaultConfig,
        schema: path.join(tempDir, 'schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      // Create required files
      fs.writeFileSync(config.schema, 'export const ConfigSchema = {}');
      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(executeDoctor({ config }));

      const jsonnetCheck = result.checks.find((c) => c.name === 'File: Jsonnet template');
      expect(jsonnetCheck?.status).toBe('ok');
    });

    it('should check provider is registered', async () => {
      const config: ResolvedConfig = {
        ...defaultConfig,
        schema: path.join(tempDir, 'schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      // Create required files
      fs.writeFileSync(config.schema, 'export const ConfigSchema = {}');
      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(executeDoctor({ config }));

      const providerCheck = result.checks.find((c) => c.name === 'Provider: mock');
      expect(providerCheck?.status).toBe('ok');
    });

    it('should report all passed when everything is ok', async () => {
      const config: ResolvedConfig = {
        ...defaultConfig,
        schema: path.join(tempDir, 'schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      // Create required files
      fs.writeFileSync(config.schema, 'export const ConfigSchema = {}');
      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(executeDoctor({ config }));

      expect(result.allPassed).toBe(true);
    });
  });

  describe('runDoctor', () => {
    it('should return true when all checks pass', async () => {
      const config: ResolvedConfig = {
        ...defaultConfig,
        schema: path.join(tempDir, 'schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      // Create required files
      fs.writeFileSync(config.schema, 'export const ConfigSchema = {}');
      fs.writeFileSync(config.jsonnet, '{}');

      const result = await Effect.runPromise(runDoctor({ config }));

      expect(result).toBe(true);
    });

    it('should return false when any check fails', async () => {
      vi.mocked(execa).mockRejectedValue(new Error('not found'));

      const config: ResolvedConfig = {
        ...defaultConfig,
        schema: path.join(tempDir, 'nonexistent-schema.ts'),
        jsonnet: path.join(tempDir, 'config.jsonnet'),
      };

      const result = await Effect.runPromise(runDoctor({ config }));

      expect(result).toBe(false);
    });
  });
});
