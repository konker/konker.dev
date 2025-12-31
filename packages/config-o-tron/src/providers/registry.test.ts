/**
 * Provider Registry Tests
 */
// Import AwsSsmProvider to trigger its side-effect registration
import './AwsSsmProvider.js';

import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { ErrorCode } from '../errors.js';
import { getProvider, getRegisteredProviders, isProviderRegistered, registerProvider } from './registry.js';

describe('Provider Registry', () => {
  describe('registerProvider', () => {
    it('should register a provider factory', () => {
      const customProvider = {
        name: 'custom-test',
        capabilities: {},
        fetch: () => Effect.succeed({}),
        upsert: () => Effect.void,
        delete: () => Effect.void,
      };

      registerProvider('custom-test', () => customProvider);

      expect(isProviderRegistered('custom-test')).toBe(true);
    });

    it('should normalize provider names to lowercase', () => {
      const customProvider = {
        name: 'uppercase-test',
        capabilities: {},
        fetch: () => Effect.succeed({}),
        upsert: () => Effect.void,
        delete: () => Effect.void,
      };

      registerProvider('UPPERCASE-TEST', () => customProvider);

      expect(isProviderRegistered('uppercase-test')).toBe(true);
      expect(isProviderRegistered('UPPERCASE-TEST')).toBe(true);
    });
  });

  describe('getProvider', () => {
    it('should return mock provider', async () => {
      const provider = await Effect.runPromise(getProvider('mock'));

      expect(provider.name).toBe('mock');
    });

    it('should return aws-ssm provider', async () => {
      const provider = await Effect.runPromise(getProvider('aws-ssm'));

      expect(provider.name).toBe('aws-ssm');
    });

    it('should be case-insensitive', async () => {
      const provider1 = await Effect.runPromise(getProvider('Mock'));
      const provider2 = await Effect.runPromise(getProvider('MOCK'));

      expect(provider1.name).toBe('mock');
      expect(provider2.name).toBe('mock');
    });

    it('should fail for unregistered provider', async () => {
      const exit = await Effect.runPromiseExit(getProvider('nonexistent'));

      expect(exit._tag).toBe('Failure');
      if (exit._tag === 'Failure') {
        const cause = exit.cause;
        if (cause._tag === 'Fail') {
          expect(cause.error.context.code).toBe(ErrorCode.PROV001);
        }
      }
    });
  });

  describe('getRegisteredProviders', () => {
    it('should return list of registered provider names', () => {
      const providers = getRegisteredProviders();

      expect(providers).toContain('mock');
      expect(providers).toContain('aws-ssm');
    });

    it('should return lowercase names', () => {
      const providers = getRegisteredProviders();

      for (const name of providers) {
        expect(name).toBe(name.toLowerCase());
      }
    });
  });

  describe('isProviderRegistered', () => {
    it('should return true for registered providers', () => {
      expect(isProviderRegistered('mock')).toBe(true);
      expect(isProviderRegistered('aws-ssm')).toBe(true);
    });

    it('should return false for unregistered providers', () => {
      expect(isProviderRegistered('nonexistent')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isProviderRegistered('Mock')).toBe(true);
      expect(isProviderRegistered('AWS-SSM')).toBe(true);
    });
  });
});
