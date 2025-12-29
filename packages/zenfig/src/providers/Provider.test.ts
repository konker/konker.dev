/**
 * Provider Utility Tests
 */
import { describe, expect, it } from 'vitest';

import {
  buildFullPath,
  dotToSlashPath,
  EncryptionType,
  extractKeyPath,
  type ProviderContext,
  slashToDotPath,
} from './Provider.js';

describe('Provider', () => {
  describe('EncryptionType', () => {
    it('should have correct values', () => {
      expect(EncryptionType.SECURE_STRING).toBe('SecureString');
      expect(EncryptionType.STRING).toBe('String');
      expect(EncryptionType.UNKNOWN).toBe('Unknown');
    });
  });

  describe('dotToSlashPath', () => {
    it('should convert single dot to slash', () => {
      expect(dotToSlashPath('database.url')).toBe('database/url');
    });

    it('should convert multiple dots to slashes', () => {
      expect(dotToSlashPath('database.connection.url')).toBe('database/connection/url');
    });

    it('should handle single segment (no dots)', () => {
      expect(dotToSlashPath('database')).toBe('database');
    });

    it('should handle empty string', () => {
      expect(dotToSlashPath('')).toBe('');
    });

    it('should handle deep nesting', () => {
      expect(dotToSlashPath('a.b.c.d.e.f')).toBe('a/b/c/d/e/f');
    });
  });

  describe('slashToDotPath', () => {
    it('should convert single slash to dot', () => {
      expect(slashToDotPath('database/url')).toBe('database.url');
    });

    it('should convert multiple slashes to dots', () => {
      expect(slashToDotPath('database/connection/url')).toBe('database.connection.url');
    });

    it('should handle single segment (no slashes)', () => {
      expect(slashToDotPath('database')).toBe('database');
    });

    it('should handle empty string', () => {
      expect(slashToDotPath('')).toBe('');
    });

    it('should handle deep nesting', () => {
      expect(slashToDotPath('a/b/c/d/e/f')).toBe('a.b.c.d.e.f');
    });
  });

  describe('buildFullPath', () => {
    const ctx: ProviderContext = {
      prefix: '/zenfig',
      service: 'api',
      env: 'prod',
    };

    it('should build full path for simple key', () => {
      expect(buildFullPath(ctx, 'database.url')).toBe('/zenfig/prod/api/database/url');
    });

    it('should build full path for nested key', () => {
      expect(buildFullPath(ctx, 'database.connection.url')).toBe('/zenfig/prod/api/database/connection/url');
    });

    it('should build full path for single segment key', () => {
      expect(buildFullPath(ctx, 'timeout')).toBe('/zenfig/prod/api/timeout');
    });

    it('should handle different context values', () => {
      const customCtx: ProviderContext = {
        prefix: '/custom',
        service: 'myapp',
        env: 'staging',
      };
      expect(buildFullPath(customCtx, 'api.key')).toBe('/custom/staging/myapp/api/key');
    });

    it('should handle context with empty prefix', () => {
      const ctxNoPrefix: ProviderContext = {
        prefix: '',
        service: 'api',
        env: 'prod',
      };
      expect(buildFullPath(ctxNoPrefix, 'database.url')).toBe('/prod/api/database/url');
    });
  });

  describe('extractKeyPath', () => {
    const ctx: ProviderContext = {
      prefix: '/zenfig',
      service: 'api',
      env: 'prod',
    };

    it('should extract key path from full path', () => {
      expect(extractKeyPath('/zenfig/prod/api/database/url', ctx)).toBe('database.url');
    });

    it('should extract nested key path', () => {
      expect(extractKeyPath('/zenfig/prod/api/database/connection/url', ctx)).toBe('database.connection.url');
    });

    it('should extract single segment key path', () => {
      expect(extractKeyPath('/zenfig/prod/api/timeout', ctx)).toBe('timeout');
    });

    it('should handle path that does not match prefix', () => {
      // When path doesn't start with the expected prefix, it just converts slashes to dots
      expect(extractKeyPath('/other/path/value', ctx)).toBe('.other.path.value');
    });

    it('should handle different context values', () => {
      const customCtx: ProviderContext = {
        prefix: '/custom',
        service: 'myapp',
        env: 'staging',
      };
      expect(extractKeyPath('/custom/staging/myapp/api/key', customCtx)).toBe('api.key');
    });

    it('should handle empty key path', () => {
      expect(extractKeyPath('/zenfig/prod/api/', ctx)).toBe('');
    });
  });
});
