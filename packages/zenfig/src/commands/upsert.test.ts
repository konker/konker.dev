/**
 * Upsert Command Tests
 */
import { Readable } from 'node:stream';

import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ResolvedConfig } from '../config.js';
import { EncryptionType, type Provider } from '../providers/Provider.js';
import { registerProvider } from '../providers/registry.js';
import { createTestConfig, registerMockProviderWithData, schemaBasicPath } from '../test/fixtures/index.js';
import { executeUpsert, runUpsert } from './upsert.js';

describe('Upsert Command', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  const baseConfig: ResolvedConfig = createTestConfig({ schema: schemaBasicPath });
  const buildConfig = (provider: string, overrides: Partial<ResolvedConfig> = {}): ResolvedConfig => ({
    ...baseConfig,
    provider,
    ...overrides,
  });
  let providerCounter = 0;

  const registerCustomProvider = (provider: Provider): string => {
    const name = `custom-provider-${providerCounter++}`;
    registerProvider(name, () => provider);
    return name;
  };

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeUpsert', () => {
    it('should upsert a string value', async () => {
      const { name } = registerMockProviderWithData();

      const result = await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.host',
          value: 'localhost',
          config: buildConfig(name),
        })
      );

      expect(result.canonicalKey).toBe('database.host');
      expect(result.value).toBe('localhost');
      expect(result.serialized).toBe('localhost');
    });

    it('should upsert an integer value', async () => {
      const { name } = registerMockProviderWithData();

      const result = await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.port',
          value: '5432',
          config: buildConfig(name),
        })
      );

      expect(result.canonicalKey).toBe('database.port');
      expect(result.value).toBe(5432);
      expect(result.serialized).toBe('5432');
    });

    it('should fail for invalid value type', async () => {
      const { name } = registerMockProviderWithData();

      const exit = await Effect.runPromiseExit(
        executeUpsert({
          service: 'api',
          key: 'database.port',
          value: 'not-a-number',
          config: buildConfig(name),
        })
      );

      expect(exit._tag).toBe('Failure');
    });

    it('should fail for constraint violation', async () => {
      const { name } = registerMockProviderWithData();

      const exit = await Effect.runPromiseExit(
        executeUpsert({
          service: 'api',
          key: 'database.port',
          value: '99999',
          config: buildConfig(name),
        })
      );

      expect(exit._tag).toBe('Failure');
    });

    it('should fail for unknown key', async () => {
      const { name } = registerMockProviderWithData();

      const exit = await Effect.runPromiseExit(
        executeUpsert({
          service: 'api',
          key: 'unknown.key',
          value: 'value',
          config: buildConfig(name),
        })
      );

      expect(exit._tag).toBe('Failure');
    });

    it('should store value in provider', async () => {
      const { name, provider } = registerMockProviderWithData();

      await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.host',
          value: 'myhost.example.com',
          config: buildConfig(name),
        })
      );

      const stored = await Effect.runPromise(provider.fetch({ prefix: '/zenfig', service: 'api', env: 'dev' }));
      expect(stored['database.host']).toBe('myhost.example.com');
    });

    it('should use explicit type when provided', async () => {
      const { name } = registerMockProviderWithData();

      const result = await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.port',
          value: '8080',
          type: 'int',
          config: buildConfig(name),
        })
      );

      expect(result.value).toBe(8080);
    });

    it('should read value from stdin when requested', async () => {
      const { name } = registerMockProviderWithData();
      const stdinDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin');
      const mockStdin = Readable.from([Buffer.from('5432\n')]);
      Object.defineProperty(process, 'stdin', { value: mockStdin });

      try {
        const result = await Effect.runPromise(
          executeUpsert({
            service: 'api',
            key: 'database.port',
            stdin: true,
            config: buildConfig(name),
          })
        );

        expect(result.value).toBe(5432);
      } finally {
        if (stdinDescriptor) {
          Object.defineProperty(process, 'stdin', stdinDescriptor);
        }
      }
    });

    it('should skip encryption verification when requested', async () => {
      const { name, provider } = registerMockProviderWithData();
      const verifySpy = vi.spyOn(provider, 'verifyEncryption');

      const result = await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.host',
          value: 'localhost',
          skipEncryptionCheck: true,
          config: buildConfig(name),
        })
      );

      expect(result.encrypted).toBe(true);
      expect(verifySpy).not.toHaveBeenCalled();
    });

    it('should default to empty string when value is missing', async () => {
      const { name } = registerMockProviderWithData();

      const result = await Effect.runPromise(
        executeUpsert({
          service: 'api',
          key: 'database.host',
          config: buildConfig(name),
        })
      );

      expect(result.value).toBe('');
      expect(result.serialized).toBe('');
    });
  });

  describe('runUpsert', () => {
    it('should print success message', async () => {
      const { name } = registerMockProviderWithData();

      await Effect.runPromise(
        runUpsert({
          service: 'api',
          key: 'database.host',
          value: 'localhost',
          config: buildConfig(name),
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Successfully wrote database.host'));
    });

    it('should warn if value may not be encrypted', async () => {
      const { provider } = registerMockProviderWithData();
      const nonEncryptingProvider: Provider = {
        ...provider,
        capabilities: { ...provider.capabilities, encryptionVerification: true },
        verifyEncryption: () => Effect.succeed(EncryptionType.STRING),
      };
      const name = registerCustomProvider(nonEncryptingProvider);

      await Effect.runPromise(
        runUpsert({
          service: 'api',
          key: 'database.host',
          value: 'localhost',
          config: buildConfig(name),
        })
      );

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Warning: Value may not be encrypted'));
    });
  });
});
