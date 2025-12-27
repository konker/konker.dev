/**
 * Flatten/Unflatten Tests
 */
import { describe, expect, it } from 'vitest';

import { camelToScreamingSnake, envKeyToPath, flatten, pathToEnvKey, unflatten } from './flatten.js';

describe('flatten', () => {
  describe('flatten', () => {
    it('should flatten simple object', () => {
      const input = {
        database: {
          host: 'localhost',
          port: 5432,
        },
      };

      const result = flatten(input);

      expect(result).toEqual({
        'database.host': 'localhost',
        'database.port': 5432,
      });
    });

    it('should flatten deeply nested object', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };

      const result = flatten(input);

      expect(result).toEqual({
        'level1.level2.level3.value': 'deep',
      });
    });

    it('should handle arrays as values', () => {
      const input = {
        config: {
          tags: ['a', 'b', 'c'],
        },
      };

      const result = flatten(input);

      expect(result).toEqual({
        'config.tags': ['a', 'b', 'c'],
      });
    });

    it('should handle null values', () => {
      const input = {
        nullable: null,
        nested: {
          also: null,
        },
      };

      const result = flatten(input);

      expect(result).toEqual({
        nullable: null,
        'nested.also': null,
      });
    });

    it('should handle empty object', () => {
      const result = flatten({});
      expect(result).toEqual({});
    });
  });

  describe('unflatten', () => {
    it('should unflatten simple paths', () => {
      const input = {
        'database.host': 'localhost',
        'database.port': '5432',
      };

      const result = unflatten(input);

      expect(result).toEqual({
        database: {
          host: 'localhost',
          port: '5432',
        },
      });
    });

    it('should unflatten deep paths', () => {
      const input = {
        'a.b.c.d': 'value',
      };

      const result = unflatten(input);

      expect(result).toEqual({
        a: {
          b: {
            c: {
              d: 'value',
            },
          },
        },
      });
    });

    it('should handle multiple paths to same object', () => {
      const input = {
        'db.host': 'localhost',
        'db.port': '5432',
        'db.name': 'mydb',
      };

      const result = unflatten(input);

      expect(result).toEqual({
        db: {
          host: 'localhost',
          port: '5432',
          name: 'mydb',
        },
      });
    });
  });

  describe('pathToEnvKey', () => {
    it('should convert dot notation to SCREAMING_SNAKE_CASE', () => {
      expect(pathToEnvKey('database.host')).toBe('DATABASE_HOST');
      expect(pathToEnvKey('server.port')).toBe('SERVER_PORT');
    });

    it('should handle camelCase segments', () => {
      expect(pathToEnvKey('myService.apiKey')).toBe('MY_SERVICE_API_KEY');
      expect(pathToEnvKey('database.connectionString')).toBe('DATABASE_CONNECTION_STRING');
    });

    it('should handle single segment', () => {
      expect(pathToEnvKey('port')).toBe('PORT');
      expect(pathToEnvKey('apiKey')).toBe('API_KEY');
    });

    it('should handle custom separator', () => {
      expect(pathToEnvKey('database.host', '__')).toBe('DATABASE__HOST');
    });
  });

  describe('envKeyToPath', () => {
    it('should convert SCREAMING_SNAKE_CASE to dot notation', () => {
      expect(envKeyToPath('DATABASE_HOST')).toBe('database.host');
      expect(envKeyToPath('SERVER_PORT')).toBe('server.port');
    });

    it('should handle single word', () => {
      expect(envKeyToPath('PORT')).toBe('port');
    });

    it('should handle custom separator', () => {
      expect(envKeyToPath('DATABASE__HOST', '__')).toBe('database.host');
    });
  });

  describe('camelToScreamingSnake', () => {
    it('should convert camelCase', () => {
      expect(camelToScreamingSnake('timeoutMs')).toBe('TIMEOUT_MS');
      expect(camelToScreamingSnake('enableBeta')).toBe('ENABLE_BETA');
    });

    it('should handle consecutive uppercase', () => {
      expect(camelToScreamingSnake('APIKey')).toBe('API_KEY');
    });

    it('should handle already uppercase', () => {
      expect(camelToScreamingSnake('API')).toBe('API');
    });
  });
});
