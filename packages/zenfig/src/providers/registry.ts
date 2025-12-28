/**
 * Provider Registry
 *
 * Manages available providers and returns instances by name
 */
import * as Effect from 'effect/Effect';

import { connectionFailedError, type ProviderError } from '../errors.js';
import { mockProvider } from './MockProvider.js';
import { type Provider } from './Provider.js';

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
export function registerProvider(name: string, factory: ProviderFactory): void {
  registry.set(name.toLowerCase(), factory);
}

/**
 * Get a provider by name
 */
export function getProvider(name: string): Effect.Effect<Provider, ProviderError> {
  const factory = registry.get(name.toLowerCase());
  return factory
    ? Effect.succeed(factory())
    : Effect.fail(connectionFailedError(name, `Provider '${name}' is not registered`));
}

/**
 * Get list of registered provider names
 */
export function getRegisteredProviders(): ReadonlyArray<string> {
  return Array.from(registry.keys());
}

/**
 * Check if a provider is registered
 */
export function isProviderRegistered(name: string): boolean {
  return registry.has(name.toLowerCase());
}

// --------------------------------------------------------------------------
// Default Providers
// --------------------------------------------------------------------------

// Register mock provider
registerProvider('mock', () => mockProvider);

// Note: ChamberProvider will be registered separately in ChamberProvider.ts
