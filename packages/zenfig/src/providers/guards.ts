/**
 * Provider Guards
 *
 * Utilities for resolving and invoking provider guard checks.
 */
import * as Effect from 'effect/Effect';

import { type ProviderGuardsConfig } from '../config.js';
import { type ProviderError } from '../errors.js';
import { type Provider, type ProviderContext } from './Provider.js';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const normalizeProviderName = (name: string): string => name.toLowerCase();

const isGuardOverrideEnabled = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true';
};

// --------------------------------------------------------------------------
// Guard Resolution
// --------------------------------------------------------------------------

export const getProviderGuardConfig = (
  providerName: string,
  providerGuards: ProviderGuardsConfig
): unknown | undefined => {
  const direct = providerGuards[providerName];
  if (direct !== undefined) {
    return direct;
  }

  const normalized = normalizeProviderName(providerName);
  const normalizedDirect = providerGuards[normalized];
  if (normalizedDirect !== undefined) {
    return normalizedDirect;
  }

  const matchedKey = Object.keys(providerGuards).find((key) => normalizeProviderName(key) === normalized);
  if (matchedKey) {
    return providerGuards[matchedKey];
  }

  return undefined;
};

// --------------------------------------------------------------------------
// Guard Invocation
// --------------------------------------------------------------------------

export const shouldIgnoreProviderGuards = (): boolean =>
  isGuardOverrideEnabled(process.env.ZENFIG_IGNORE_PROVIDER_GUARDS);

export const checkProviderGuards = (
  provider: Provider,
  ctx: ProviderContext,
  providerGuards: ProviderGuardsConfig
): Effect.Effect<void, ProviderError> => {
  if (!provider.checkGuards) {
    return Effect.void;
  }

  if (shouldIgnoreProviderGuards()) {
    return Effect.void;
  }

  const guardConfig = getProviderGuardConfig(provider.name, providerGuards);
  if (guardConfig === undefined) {
    return Effect.void;
  }

  return provider.checkGuards(ctx, guardConfig);
};
