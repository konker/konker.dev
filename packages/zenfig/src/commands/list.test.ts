/**
 * List Command Tests
 */
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ResolvedConfig } from '../config.js';
import { createMockProvider } from '../providers/MockProvider.js';
import type { ProviderContext } from '../providers/Provider.js';
import { executeList, formatListJson, formatListKeys, formatListTable, type ListOptions, runList } from './list.js';

// Mock the registry to return our mock provider
vi.mock('../providers/registry.js', () => ({
  getProvider: vi.fn(),
}));

import { getProvider } from '../providers/registry.js';

describe('List Command', () => {
  const ctx: ProviderContext = {
    prefix: '/zenfig',
    service: 'test-service',
    env: 'dev',
  };

  const baseConfig: ResolvedConfig = {
    env: ctx.env,
    provider: 'mock',
    ssmPrefix: ctx.prefix,
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
  };

  let mockProvider: ReturnType<typeof createMockProvider>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockProvider = createMockProvider();
    vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // formatListKeys tests
  // --------------------------------------------------------------------------

  describe('formatListKeys', () => {
    it('should return "No keys found." for empty keys', () => {
      const result = formatListKeys([]);
      expect(result).toBe('No keys found.');
    });

    it('should return single key on one line', () => {
      const result = formatListKeys(['database.url']);
      expect(result).toBe('database.url');
    });

    it('should return multiple keys joined by newlines', () => {
      const result = formatListKeys(['api.timeout', 'database.url', 'redis.host']);
      expect(result).toBe('api.timeout\ndatabase.url\nredis.host');
    });
  });

  // --------------------------------------------------------------------------
  // formatListTable tests
  // --------------------------------------------------------------------------

  describe('formatListTable', () => {
    it('should return "No keys found." for empty keys', () => {
      const result = formatListTable({}, [], false);
      expect(result).toBe('No keys found.');
    });

    it('should format keys with redacted values by default', () => {
      const kv = { 'database.url': 'postgres://localhost', 'api.key': 'secret123' };
      const keys = ['api.key', 'database.url'];
      const result = formatListTable(kv, keys, false);

      expect(result).toContain('api.key');
      expect(result).toContain('database.url');
      expect(result).toContain('<redacted>');
      expect(result).not.toContain('postgres://localhost');
      expect(result).not.toContain('secret123');
    });

    it('should show actual values when showValues is true', () => {
      const kv = { 'database.url': 'postgres://localhost' };
      const keys = ['database.url'];
      const result = formatListTable(kv, keys, true);

      expect(result).toContain('database.url');
      expect(result).toContain('postgres://localhost');
    });
  });

  // --------------------------------------------------------------------------
  // formatListJson tests
  // --------------------------------------------------------------------------

  describe('formatListJson', () => {
    it('should return "{}" for empty keys', () => {
      const result = formatListJson({}, [], false);
      expect(result).toBe('{}');
    });

    it('should format keys with redacted values by default', () => {
      const kv = { 'database.url': 'postgres://localhost', 'api.key': 'secret123' };
      const keys = ['api.key', 'database.url'];
      const result = formatListJson(kv, keys, false);
      const parsed = JSON.parse(result);

      expect(parsed['api.key']).toBe('<redacted>');
      expect(parsed['database.url']).toBe('<redacted>');
    });

    it('should show actual values when showValues is true', () => {
      const kv = { 'database.url': 'postgres://localhost', 'api.key': 'secret123' };
      const keys = ['api.key', 'database.url'];
      const result = formatListJson(kv, keys, true);
      const parsed = JSON.parse(result);

      expect(parsed['api.key']).toBe('secret123');
      expect(parsed['database.url']).toBe('postgres://localhost');
    });

    it('should output pretty-printed JSON', () => {
      const kv = { key: 'value' };
      const result = formatListJson(kv, ['key'], true);

      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });
  });

  // --------------------------------------------------------------------------
  // executeList tests
  // --------------------------------------------------------------------------

  describe('executeList', () => {
    it('should return empty keys for empty provider', async () => {
      const options: ListOptions = {
        service: ctx.service,
        config: baseConfig,
      };

      const result = await Effect.runPromise(executeList(options));

      expect(result.keys).toEqual([]);
      expect(result.values).toEqual({});
    });

    it('should return sorted keys from provider', async () => {
      const storageKey = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
      mockProvider = createMockProvider({
        [storageKey]: {
          'zebra.key': 'z-value',
          'alpha.key': 'a-value',
          'middle.key': 'm-value',
        },
      });
      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));

      const options: ListOptions = {
        service: ctx.service,
        config: baseConfig,
      };

      const result = await Effect.runPromise(executeList(options));

      expect(result.keys).toEqual(['alpha.key', 'middle.key', 'zebra.key']);
      expect(result.values).toEqual({
        'zebra.key': 'z-value',
        'alpha.key': 'a-value',
        'middle.key': 'm-value',
      });
    });

    it('should sort keys case-insensitively', async () => {
      const storageKey = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
      mockProvider = createMockProvider({
        [storageKey]: {
          'Zebra.key': 'z-value',
          'alpha.key': 'a-value',
          'BETA.key': 'b-value',
        },
      });
      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));

      const options: ListOptions = {
        service: ctx.service,
        config: baseConfig,
      };

      const result = await Effect.runPromise(executeList(options));

      expect(result.keys).toEqual(['alpha.key', 'BETA.key', 'Zebra.key']);
    });
  });

  // --------------------------------------------------------------------------
  // runList tests
  // --------------------------------------------------------------------------

  describe('runList', () => {
    it('should output keys format by default', async () => {
      const storageKey = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
      mockProvider = createMockProvider({
        [storageKey]: {
          'database.url': 'postgres://localhost',
          'api.key': 'secret',
        },
      });
      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));

      const options: ListOptions = {
        service: ctx.service,
        config: baseConfig,
      };

      await Effect.runPromise(runList(options));

      expect(consoleSpy).toHaveBeenCalledWith('api.key\ndatabase.url');
    });

    it('should output keys format when format is "keys"', async () => {
      const storageKey = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
      mockProvider = createMockProvider({
        [storageKey]: { key1: 'value1' },
      });
      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));

      const options: ListOptions = {
        service: ctx.service,
        format: 'keys',
        config: baseConfig,
      };

      await Effect.runPromise(runList(options));

      expect(consoleSpy).toHaveBeenCalledWith('key1');
    });

    it('should output table format when format is "table"', async () => {
      const storageKey = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
      mockProvider = createMockProvider({
        [storageKey]: { 'test.key': 'test-value' },
      });
      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));

      const options: ListOptions = {
        service: ctx.service,
        format: 'table',
        config: baseConfig,
      };

      await Effect.runPromise(runList(options));

      const output = consoleSpy.mock.calls[0]![0] as string;
      expect(output).toContain('test.key');
      expect(output).toContain('<redacted>');
    });

    it('should output json format when format is "json"', async () => {
      const storageKey = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
      mockProvider = createMockProvider({
        [storageKey]: { 'test.key': 'test-value' },
      });
      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));

      const options: ListOptions = {
        service: ctx.service,
        format: 'json',
        config: baseConfig,
      };

      await Effect.runPromise(runList(options));

      const output = consoleSpy.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);
      expect(parsed['test.key']).toBe('<redacted>');
    });

    it('should show values when unsafeShowValues is true', async () => {
      const storageKey = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
      mockProvider = createMockProvider({
        [storageKey]: { 'test.key': 'secret-value' },
      });
      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));

      const options: ListOptions = {
        service: ctx.service,
        format: 'json',
        unsafeShowValues: true,
        config: baseConfig,
      };

      await Effect.runPromise(runList(options));

      const output = consoleSpy.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);
      expect(parsed['test.key']).toBe('secret-value');
    });

    it('should redact values when showValues is true but stdout is not TTY', async () => {
      const storageKey = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
      mockProvider = createMockProvider({
        [storageKey]: { 'test.key': 'secret-value' },
      });
      vi.mocked(getProvider).mockReturnValue(Effect.succeed(mockProvider));

      // Mock stdout.isTTY to be false
      const originalIsTTY = process.stdout.isTTY;
      Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });

      const options: ListOptions = {
        service: ctx.service,
        format: 'json',
        showValues: true,
        config: baseConfig,
      };

      await Effect.runPromise(runList(options));

      // Restore
      Object.defineProperty(process.stdout, 'isTTY', { value: originalIsTTY, configurable: true });

      const output = consoleSpy.mock.calls[0]![0] as string;
      const parsed = JSON.parse(output);
      expect(parsed['test.key']).toBe('<redacted>');
    });

    it('should output "No keys found." for empty provider with keys format', async () => {
      const options: ListOptions = {
        service: ctx.service,
        format: 'keys',
        config: baseConfig,
      };

      await Effect.runPromise(runList(options));

      expect(consoleSpy).toHaveBeenCalledWith('No keys found.');
    });

    it('should output "No keys found." for empty provider with table format', async () => {
      const options: ListOptions = {
        service: ctx.service,
        format: 'table',
        config: baseConfig,
      };

      await Effect.runPromise(runList(options));

      expect(consoleSpy).toHaveBeenCalledWith('No keys found.');
    });

    it('should output "{}" for empty provider with json format', async () => {
      const options: ListOptions = {
        service: ctx.service,
        format: 'json',
        config: baseConfig,
      };

      await Effect.runPromise(runList(options));

      expect(consoleSpy).toHaveBeenCalledWith('{}');
    });
  });
});
