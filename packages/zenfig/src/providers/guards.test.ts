/**
 * Provider Guards Tests
 */
import * as Effect from 'effect/Effect';
import { afterEach, describe, expect, it } from 'vitest';

import type { ProviderGuardsConfig } from '../config.js';
import { providerGuardMismatchError } from '../errors.js';
import { checkProviderGuards, getProviderGuardConfig } from './guards.js';
import { type Provider, type ProviderContext } from './Provider.js';

describe('provider guards', () => {
  const ctx: ProviderContext = {
    prefix: '/zenfig',
    service: 'api',
    env: 'dev',
  };

  const baseProvider: Provider = {
    name: 'mock',
    capabilities: {},
    fetch: () => Effect.succeed({}),
    upsert: () => Effect.void,
    delete: () => Effect.void,
  };

  afterEach(() => {
    // eslint-disable-next-line fp/no-delete
    delete process.env.ZENFIG_IGNORE_PROVIDER_GUARDS;
  });

  it('getProviderGuardConfig should match provider names case-insensitively', () => {
    const guards: ProviderGuardsConfig = {
      Chamber: { region: 'us-east-1' },
    };

    expect(getProviderGuardConfig('chamber', guards)).toEqual({ region: 'us-east-1' });
    expect(getProviderGuardConfig('Chamber', guards)).toEqual({ region: 'us-east-1' });
  });

  it('getProviderGuardConfig should return direct matches', () => {
    const guards: ProviderGuardsConfig = {
      mock: { env: 'dev' },
    };

    expect(getProviderGuardConfig('mock', guards)).toEqual({ env: 'dev' });
  });

  it('getProviderGuardConfig should match normalized provider names', () => {
    const guards: ProviderGuardsConfig = {
      chamber: { region: 'us-east-1' },
    };

    expect(getProviderGuardConfig('Chamber', guards)).toEqual({ region: 'us-east-1' });
  });

  it('checkProviderGuards should no-op when provider lacks guard hook', async () => {
    const provider: Provider = {
      ...baseProvider,
    };

    await expect(Effect.runPromise(checkProviderGuards(provider, ctx, {}))).resolves.toBeUndefined();
  });

  it('checkProviderGuards should no-op when provider has no guard config', async () => {
    const provider: Provider = {
      ...baseProvider,
      checkGuards: () => Effect.fail(providerGuardMismatchError('mock', 'should not run')),
    };

    await expect(Effect.runPromise(checkProviderGuards(provider, ctx, {}))).resolves.toBeUndefined();
  });

  it('checkProviderGuards should skip when override flag is enabled', async () => {
    process.env.ZENFIG_IGNORE_PROVIDER_GUARDS = 'true';
    let called = false;

    const provider: Provider = {
      ...baseProvider,
      checkGuards: () =>
        Effect.sync(() => {
          called = true;
        }),
    };

    const guards: ProviderGuardsConfig = { mock: { env: 'dev' } };
    await expect(Effect.runPromise(checkProviderGuards(provider, ctx, guards))).resolves.toBeUndefined();
    expect(called).toBe(false);
  });

  it('checkProviderGuards should pass guard config to provider', async () => {
    let received: unknown;

    const provider: Provider = {
      ...baseProvider,
      checkGuards: (_ctx, guards) =>
        Effect.sync(() => {
          received = guards;
        }),
    };

    const guards: ProviderGuardsConfig = { mock: { env: 'dev' } };
    await Effect.runPromise(checkProviderGuards(provider, ctx, guards));

    expect(received).toEqual({ env: 'dev' });
  });
});
