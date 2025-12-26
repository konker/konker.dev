/**
 * MockProvider Tests
 */
import { describe, expect, it, beforeEach } from 'vitest';
import * as Effect from 'effect/Effect';

import { createMockProvider, mockProvider } from './MockProvider.js';
import type { ProviderContext } from './Provider.js';

describe('MockProvider', () => {
  const ctx: ProviderContext = {
    prefix: '/zenfig',
    service: 'test-service',
    env: 'dev',
  };

  describe('mockProvider (default instance)', () => {
    it('should have expected capabilities', () => {
      expect(mockProvider.capabilities.secureWrite).toBe(true);
      expect(mockProvider.capabilities.encryptionVerification).toBe(true);
    });

    it('should have name mock', () => {
      expect(mockProvider.name).toBe('mock');
    });
  });

  describe('createMockProvider', () => {
    it('should create provider with empty storage', async () => {
      const provider = createMockProvider();
      const result = await Effect.runPromise(provider.fetch(ctx));
      expect(result).toEqual({});
    });

    it('should create provider with initial data', async () => {
      const storageKey = `${ctx.prefix}/${ctx.service}/${ctx.env}`;
      const provider = createMockProvider({
        [storageKey]: {
          'database.host': 'localhost',
          'database.port': '5432',
        },
      });

      const result = await Effect.runPromise(provider.fetch(ctx));

      expect(result).toEqual({
        'database.host': 'localhost',
        'database.port': '5432',
      });
    });

    it('should expose storage for inspection', () => {
      const provider = createMockProvider();
      expect(provider.storage).toBeDefined();
      expect(provider.storage.size).toBe(0);
    });
  });

  describe('fetch', () => {
    let provider: ReturnType<typeof createMockProvider>;

    beforeEach(() => {
      provider = createMockProvider();
    });

    it('should fetch empty object when no data', async () => {
      const result = await Effect.runPromise(provider.fetch(ctx));
      expect(result).toEqual({});
    });

    it('should fetch service-specific data', async () => {
      const ctx1: ProviderContext = { ...ctx, service: 'service-1' };
      const ctx2: ProviderContext = { ...ctx, service: 'service-2' };

      await Effect.runPromise(provider.upsert(ctx1, 'key1', 'value1'));
      await Effect.runPromise(provider.upsert(ctx2, 'key2', 'value2'));

      const result1 = await Effect.runPromise(provider.fetch(ctx1));
      const result2 = await Effect.runPromise(provider.fetch(ctx2));

      expect(result1).toEqual({ key1: 'value1' });
      expect(result2).toEqual({ key2: 'value2' });
    });

    it('should fetch env-specific data', async () => {
      const devCtx: ProviderContext = { ...ctx, env: 'dev' };
      const prodCtx: ProviderContext = { ...ctx, env: 'prod' };

      await Effect.runPromise(provider.upsert(devCtx, 'url', 'http://dev.local'));
      await Effect.runPromise(provider.upsert(prodCtx, 'url', 'https://prod.example.com'));

      const devResult = await Effect.runPromise(provider.fetch(devCtx));
      const prodResult = await Effect.runPromise(provider.fetch(prodCtx));

      expect(devResult).toEqual({ url: 'http://dev.local' });
      expect(prodResult).toEqual({ url: 'https://prod.example.com' });
    });
  });

  describe('upsert', () => {
    let provider: ReturnType<typeof createMockProvider>;

    beforeEach(() => {
      provider = createMockProvider();
    });

    it('should add new key', async () => {
      await Effect.runPromise(provider.upsert(ctx, 'new.key', 'new-value'));

      const result = await Effect.runPromise(provider.fetch(ctx));
      expect(result['new.key']).toBe('new-value');
    });

    it('should update existing key', async () => {
      await Effect.runPromise(provider.upsert(ctx, 'existing.key', 'old-value'));
      await Effect.runPromise(provider.upsert(ctx, 'existing.key', 'new-value'));

      const result = await Effect.runPromise(provider.fetch(ctx));
      expect(result['existing.key']).toBe('new-value');
    });

    it('should preserve other keys when upserting', async () => {
      await Effect.runPromise(provider.upsert(ctx, 'key1', 'value1'));
      await Effect.runPromise(provider.upsert(ctx, 'key2', 'value2'));
      await Effect.runPromise(provider.upsert(ctx, 'key1', 'updated'));

      const result = await Effect.runPromise(provider.fetch(ctx));
      expect(result).toEqual({
        key1: 'updated',
        key2: 'value2',
      });
    });
  });

  describe('delete', () => {
    let provider: ReturnType<typeof createMockProvider>;

    beforeEach(() => {
      provider = createMockProvider();
    });

    it('should delete existing key', async () => {
      await Effect.runPromise(provider.upsert(ctx, 'key1', 'value1'));
      await Effect.runPromise(provider.upsert(ctx, 'key2', 'value2'));

      await Effect.runPromise(provider.delete(ctx, 'key1'));

      const result = await Effect.runPromise(provider.fetch(ctx));
      expect(result).toEqual({ key2: 'value2' });
    });

    it('should fail when deleting non-existent key', async () => {
      await expect(Effect.runPromise(provider.delete(ctx, 'nonexistent'))).rejects.toThrow();
    });
  });

  describe('verifyEncryption', () => {
    it('should return SecureString by default', async () => {
      const provider = createMockProvider();
      await Effect.runPromise(provider.upsert(ctx, 'secret.key', 'secret-value'));

      const result = await Effect.runPromise(provider.verifyEncryption!(ctx, 'secret.key'));
      expect(result).toBe('SecureString');
    });
  });
});
