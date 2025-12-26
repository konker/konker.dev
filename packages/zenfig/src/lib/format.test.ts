/**
 * Format Utilities Tests
 */
import { describe, expect, it } from 'vitest';

import { detectFormat, formatEnv, formatJson, parseEnvContent } from './format.js';

describe('format', () => {
  describe('detectFormat', () => {
    it('should detect JSON object', () => {
      expect(detectFormat('{"key": "value"}')).toBe('json');
      expect(detectFormat('  {\n  "key": 1\n}')).toBe('json');
    });

    it('should detect JSON array', () => {
      expect(detectFormat('[1, 2, 3]')).toBe('json');
    });

    it('should detect env format', () => {
      expect(detectFormat('KEY=value')).toBe('env');
      expect(detectFormat('KEY=value\nKEY2=value2')).toBe('env');
    });

    it('should detect env with comments', () => {
      expect(detectFormat('# comment\nKEY=value')).toBe('env');
    });

    it('should return unknown for empty content', () => {
      expect(detectFormat('')).toBe('unknown');
      expect(detectFormat('   ')).toBe('unknown');
    });

    it('should return unknown for ambiguous content', () => {
      expect(detectFormat('just some text')).toBe('unknown');
    });
  });

  describe('formatEnv', () => {
    it('should format simple key-value pairs', () => {
      const data = {
        database: {
          host: 'localhost',
          port: 5432,
        },
      };

      const result = formatEnv(data);

      expect(result).toContain('DATABASE_HOST=localhost');
      expect(result).toContain('DATABASE_PORT=5432');
    });

    it('should quote values with spaces', () => {
      const data = {
        my: {
          value: 'hello world',
        },
      };

      const result = formatEnv(data);

      expect(result).toContain('MY_VALUE="hello world"');
    });

    it('should escape special characters in quoted values', () => {
      const data = {
        my: {
          value: 'has "quote" inside',
        },
      };

      const result = formatEnv(data);

      // Value has spaces so it will be quoted, and internal quotes are escaped
      expect(result).toContain('MY_VALUE="has \\"quote\\" inside"');
    });

    it('should sort keys alphabetically', () => {
      const data = {
        z: { key: 'z' },
        a: { key: 'a' },
        m: { key: 'm' },
      };

      const result = formatEnv(data);
      const lines = result.trim().split('\n');

      expect(lines[0]).toContain('A_KEY');
      expect(lines[1]).toContain('M_KEY');
      expect(lines[2]).toContain('Z_KEY');
    });

    it('should handle custom separator', () => {
      const data = {
        database: { host: 'localhost' },
      };

      const result = formatEnv(data, { separator: '__' });

      expect(result).toContain('DATABASE__HOST=localhost');
    });
  });

  describe('formatJson', () => {
    it('should format flat object', () => {
      const data = {
        host: 'localhost',
        port: 5432,
      };

      const result = formatJson(data);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(data);
    });

    it('should format nested object', () => {
      const data = {
        database: {
          host: 'localhost',
          port: 5432,
        },
      };

      const result = formatJson(data);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(data);
    });

    it('should pretty print with indentation', () => {
      const data = { key: 'value' };

      const result = formatJson(data);

      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });

    it('should minify when pretty is false', () => {
      const data = { key: 'value' };

      const result = formatJson(data, false);

      expect(result.trim()).toBe('{"key":"value"}');
    });
  });

  describe('parseEnvContent', () => {
    it('should parse simple key-value pairs', () => {
      const content = 'KEY=value\nKEY2=value2';

      const result = parseEnvContent(content);

      expect(result).toEqual({
        KEY: 'value',
        KEY2: 'value2',
      });
    });

    it('should handle quoted values', () => {
      const content = 'KEY="hello world"';

      const result = parseEnvContent(content);

      expect(result).toEqual({ KEY: 'hello world' });
    });

    it('should handle single-quoted values', () => {
      const content = "KEY='hello world'";

      const result = parseEnvContent(content);

      expect(result).toEqual({ KEY: 'hello world' });
    });

    it('should skip comments', () => {
      const content = '# comment\nKEY=value\n# another comment';

      const result = parseEnvContent(content);

      expect(result).toEqual({ KEY: 'value' });
    });

    it('should skip empty lines', () => {
      const content = 'KEY1=value1\n\n\nKEY2=value2';

      const result = parseEnvContent(content);

      expect(result).toEqual({
        KEY1: 'value1',
        KEY2: 'value2',
      });
    });

    it('should handle values with equals sign', () => {
      const content = 'URL=https://example.com?foo=bar';

      const result = parseEnvContent(content);

      expect(result).toEqual({ URL: 'https://example.com?foo=bar' });
    });
  });
});
