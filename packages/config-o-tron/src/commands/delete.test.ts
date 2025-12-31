/* eslint-disable fp/no-delete */
/**
 * Delete Command Tests
 */
import { Readable } from 'node:stream';

import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import {
  createBasicProviderData,
  createTestConfig,
  registerMockProviderWithData,
  schemaBasicPath,
} from '../test/fixtures/index.js';
import { executeDelete, runDelete } from './delete.js';

describe('Delete Command', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env;
  const originalStdin = process.stdin;

  const baseConfig: ResolvedConfig = createTestConfig({ schema: schemaBasicPath });
  const buildConfig = (provider: string, overrides: Partial<ResolvedConfig> = {}): ResolvedConfig => ({
    ...baseConfig,
    provider,
    ...overrides,
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
  });

  afterEach(() => {
    Object.defineProperty(process, 'stdin', { value: originalStdin, configurable: true });
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('executeDelete', () => {
    it('should delete existing key with confirm flag', async () => {
      const { name, provider } = registerMockProviderWithData(createBasicProviderData('api'));

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: buildConfig(name),
        })
      );

      expect(result.canonicalKey).toBe('database.host');
      expect(result.deleted).toBe(true);

      const stored = await Effect.runPromise(provider.fetch({ prefix: '/config-o-tron', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBeUndefined();
    });

    it('should warn for key not in schema but still delete', async () => {
      const { name } = registerMockProviderWithData(
        createBasicProviderData('api', {
          'unknown.key': 'some-value',
        })
      );

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'unknown.key',
          confirm: true,
          config: buildConfig(name),
        })
      );

      expect(result.canonicalKey).toBe('unknown.key');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Key 'unknown.key' not found in schema"));
    });

    it('should require confirm flag in CI mode', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          config: buildConfig(name, { ci: true }),
        })
      );

      expect(result.deleted).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('--confirm flag required in CI mode'));
    });

    it('should delete in CI mode with confirm flag', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: buildConfig(name, { ci: true }),
        })
      );

      expect(result.deleted).toBe(true);
    });

    it('should log audit information', async () => {
      process.env.USER = 'testuser';
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: buildConfig(name),
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/Deleted: database\.host by testuser/));
    });

    it('should fall back to USERNAME when USER is not set', async () => {
      delete process.env.USER;
      process.env.USERNAME = 'altuser';
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: buildConfig(name),
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/Deleted: database\.host by altuser/));
    });

    it('should use unknown when no user info is available', async () => {
      delete process.env.USER;
      delete process.env.USERNAME;
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: buildConfig(name),
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/Deleted: database\.host by unknown/));
    });

    it('should cancel deletion when prompt declines', async () => {
      const { name, provider } = registerMockProviderWithData(createBasicProviderData('api'));
      const mockStdin = Readable.from(['n\n']);
      Object.defineProperty(process, 'stdin', { value: mockStdin, configurable: true });

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          config: buildConfig(name),
        })
      );

      expect(result.deleted).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Deletion cancelled.');

      const stored = await Effect.runPromise(provider.fetch({ prefix: '/config-o-tron', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('localhost');
    });

    it('should delete when prompt confirms', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));
      const mockStdin = Readable.from(['y\n']);
      Object.defineProperty(process, 'stdin', { value: mockStdin, configurable: true });

      const result = await Effect.runPromise(
        executeDelete({
          service: 'api',
          key: 'database.host',
          config: buildConfig(name),
        })
      );

      expect(result.deleted).toBe(true);
    });
  });

  describe('runDelete', () => {
    it('should print success message on deletion', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      const result = await Effect.runPromise(
        runDelete({
          service: 'api',
          key: 'database.host',
          confirm: true,
          config: buildConfig(name),
        })
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully deleted database.host'));
    });

    it('should return false when not deleted', async () => {
      const { name } = registerMockProviderWithData(createBasicProviderData('api'));

      const result = await Effect.runPromise(
        runDelete({
          service: 'api',
          key: 'database.host',
          config: buildConfig(name, { ci: true }),
        })
      );

      expect(result).toBe(false);
    });
  });
});
