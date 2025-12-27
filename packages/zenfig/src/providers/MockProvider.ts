/**
 * Mock Provider
 *
 * In-memory provider for testing and development
 */
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { parameterNotFoundError, type ProviderError } from '../errors.js';
import {
  EncryptionType,
  type EncryptionTypeValue,
  type Provider,
  type ProviderCapabilities,
  type ProviderContext,
  type ProviderKV,
} from './Provider.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/**
 * Storage key format: "prefix/service/env"
 */
type StorageKey = string;

/**
 * In-memory storage
 */
type MockStorage = Map<StorageKey, ProviderKV>;

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

/**
 * Create a mock provider with optional initial data
 */
export const createMockProvider = (
  initialData?: Record<string, ProviderKV>
): Provider & { readonly storage: MockStorage } => {
  const storage: MockStorage = new Map();

  // Initialize with provided data
  if (initialData) {
    for (const [key, kv] of Object.entries(initialData)) {
      storage.set(key, { ...kv });
    }
  }

  const getStorageKey = (ctx: ProviderContext): StorageKey => `${ctx.prefix}/${ctx.service}/${ctx.env}`;

  const capabilities: ProviderCapabilities = {
    secureWrite: true,
    encryptionVerification: true,
    transactions: false,
  };

  const fetch = (ctx: ProviderContext): Effect.Effect<ProviderKV, ProviderError> =>
    Effect.sync(() => {
      const key = getStorageKey(ctx);
      return storage.get(key) ?? {};
    });

  const upsert = (ctx: ProviderContext, keyPath: string, value: string): Effect.Effect<void, ProviderError> =>
    Effect.sync(() => {
      const key = getStorageKey(ctx);
      const existing = storage.get(key) ?? {};
      storage.set(key, { ...existing, [keyPath]: value });
    });

  const deleteKey = (ctx: ProviderContext, keyPath: string): Effect.Effect<void, ProviderError> =>
    pipe(
      Effect.sync(() => {
        const key = getStorageKey(ctx);
        const existing = storage.get(key);
        return { key, existing };
      }),
      Effect.flatMap(({ existing, key }) => {
        if (!existing || !(keyPath in existing)) {
          return Effect.fail(parameterNotFoundError(keyPath, `${key}/${keyPath}`));
        }

        const { [keyPath]: _, ...rest } = existing;
        storage.set(key, rest);
        return Effect.void;
      })
    );

  const verifyEncryption = (
    _ctx: ProviderContext,
    _keyPath: string
  ): Effect.Effect<EncryptionTypeValue, ProviderError> => Effect.succeed(EncryptionType.SECURE_STRING);

  return {
    name: 'mock',
    capabilities,
    fetch,
    upsert,
    delete: deleteKey,
    verifyEncryption,
    storage,
  };
};

/**
 * Default mock provider instance (empty storage)
 */
export const mockProvider: Provider = createMockProvider();
