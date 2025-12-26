/**
 * Provider Registry
 *
 * Manages available providers and returns instances by name
 */
import * as Effect from 'effect/Effect';

import { connectionFailedError, type ProviderError } from '../errors.js';
import { type Provider } from './Provider.js';
import { mockProvider } from './MockProvider.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

type ProviderFactory = () => Provider;

type ProviderRegistry = Map<string, ProviderFactory>;

// --------------------------------------------------------------------------
// Registry
// --------------------------------------------------------------------------

/**
 * Global provider registry
 */
const registry: ProviderRegistry = new Map();

/**
 * Register a provider factory
 */
export const registerProvider = (name: string, factory: ProviderFactory): void => {
  registry.set(name.toLowerCase(), factory);
};

/**
 * Get a provider by name
 */
export const getProvider = (name: string): Effect.Effect<Provider, ProviderError> =>
  Effect.gen(function* () {
    const factory = registry.get(name.toLowerCase());
    if (!factory) {
      return yield* Effect.fail(connectionFailedError(name, `Provider '${name}' is not registered`));
    }
    return factory();
  });

/**
 * Get list of registered provider names
 */
export const getRegisteredProviders = (): ReadonlyArray<string> => Array.from(registry.keys());

/**
 * Check if a provider is registered
 */
export const isProviderRegistered = (name: string): boolean => registry.has(name.toLowerCase());

// --------------------------------------------------------------------------
// Default Providers
// --------------------------------------------------------------------------

// Register mock provider
registerProvider('mock', () => mockProvider);

// Note: ChamberProvider will be registered separately in ChamberProvider.ts
