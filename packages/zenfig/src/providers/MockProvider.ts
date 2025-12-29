/**
 * Mock Provider
 *
 * In-memory provider for testing and development
 */
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { parameterNotFoundError, type ProviderError, providerGuardMismatchError } from '../errors.js';
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
 * Storage key format: "prefix/env/service"
 */
type StorageKey = string;

/**
 * In-memory storage
 */
type MockStorage = Map<StorageKey, ProviderKV>;

type MockProviderGuards = {
  readonly prefix?: string;
  readonly service?: string;
  readonly env?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMockGuards(guards?: unknown): Effect.Effect<MockProviderGuards | undefined, ProviderError> {
  if (guards === undefined) {
    return Effect.succeed(undefined);
  }

  if (!isRecord(guards)) {
    return Effect.fail(providerGuardMismatchError('mock', 'Invalid providerGuards config for mock provider'));
  }

  const prefixRaw = guards.prefix;
  const serviceRaw = guards.service;
  const envRaw = guards.env;

  if (prefixRaw !== undefined && typeof prefixRaw !== 'string') {
    return Effect.fail(providerGuardMismatchError('mock', 'providerGuards.prefix must be a string'));
  }
  if (serviceRaw !== undefined && typeof serviceRaw !== 'string') {
    return Effect.fail(providerGuardMismatchError('mock', 'providerGuards.service must be a string'));
  }
  if (envRaw !== undefined && typeof envRaw !== 'string') {
    return Effect.fail(providerGuardMismatchError('mock', 'providerGuards.env must be a string'));
  }

  const parsed: MockProviderGuards = {
    ...(typeof prefixRaw === 'string' ? { prefix: prefixRaw } : {}),
    ...(typeof serviceRaw === 'string' ? { service: serviceRaw } : {}),
    ...(typeof envRaw === 'string' ? { env: envRaw } : {}),
  };

  if (Object.keys(parsed).length === 0) {
    return Effect.succeed(undefined);
  }

  return Effect.succeed(parsed);
}

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

/**
 * Create a mock provider with optional initial data
 */
export function createMockProvider(
  initialData?: Record<string, ProviderKV>
): Provider & { readonly storage: MockStorage } {
  const storage: MockStorage = new Map();

  // Initialize with provided data
  if (initialData) {
    for (const [key, kv] of Object.entries(initialData)) {
      storage.set(key, { ...kv });
    }
  }

  const getStorageKey = (ctx: ProviderContext): StorageKey => `${ctx.prefix}/${ctx.env}/${ctx.service}`;

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

  const checkGuards = (ctx: ProviderContext, guards?: unknown): Effect.Effect<void, ProviderError> =>
    pipe(
      parseMockGuards(guards),
      Effect.flatMap((parsed) => {
        if (!parsed) {
          return Effect.void;
        }

        const mismatches: Array<string> = [];

        if (parsed.prefix && parsed.prefix !== ctx.prefix) {
          mismatches.push(`prefix expected '${parsed.prefix}' but got '${ctx.prefix}'`);
        }
        if (parsed.service && parsed.service !== ctx.service) {
          mismatches.push(`service expected '${parsed.service}' but got '${ctx.service}'`);
        }
        if (parsed.env && parsed.env !== ctx.env) {
          mismatches.push(`env expected '${parsed.env}' but got '${ctx.env}'`);
        }

        if (mismatches.length > 0) {
          return Effect.fail(providerGuardMismatchError('mock', mismatches.join('; ')));
        }

        return Effect.void;
      })
    );

  return {
    name: 'mock',
    capabilities,
    fetch,
    upsert,
    delete: deleteKey,
    verifyEncryption,
    checkGuards,
    storage,
  };
}

/**
 * Default mock provider instance (empty storage)
 */
export const mockProvider: Provider = createMockProvider();
