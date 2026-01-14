/**
 * Format Utilities Tests
 */
import { describe, expect, it } from 'vitest';

import { detectFormat, formatConfig, formatEnv, formatJson, parseEnvContent } from './format.js';

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

    it('should escape special characters in double quoted values', () => {
      const data = {
        my: {
          value: "has 'quote' inside",
        },
      };

      const result = formatEnv(data);

      // Value has spaces, so it will be quoted, and internal quotes are escaped
      expect(result).toContain(`MY_VALUE="has 'quote' inside"`);
    });

    it('should escape special characters in single quoted values', () => {
      const data = {
        my: {
          value: 'has "quote" inside',
        },
      };

      const result = formatEnv(data);

      // Value has spaces, so it will be quoted, and internal quotes are escaped
      expect(result).toContain(`MY_VALUE='has "quote" inside`);
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

    it('should omit undefined values', () => {
      const data = {
        defined: 'value',
        notDefined: undefined,
      };

      const result = formatEnv(data);

      expect(result).toContain('DEFINED=value');
      expect(result).not.toContain('NOT_DEFINED');
    });

    it('should omit null values', () => {
      const data = {
        defined: 'value',
        nullValue: null,
      };

      const result = formatEnv(data);

      expect(result).toContain('DEFINED=value');
      expect(result).not.toContain('NULL_VALUE');
    });

    it('should format boolean values', () => {
      const data = {
        enabled: true,
        disabled: false,
      };

      const result = formatEnv(data);

      expect(result).toContain('ENABLED=true');
      expect(result).toContain('DISABLED=false');
    });

    it('should format arrays as quoted JSON', () => {
      const data = {
        tags: ['a', 'b', 'c'],
      };

      const result = formatEnv(data);

      expect(result).toContain('TAGS="[\\"a\\",\\"b\\",\\"c\\"]"');
    });

    it('should format objects as quoted JSON', () => {
      const data = {
        nested: { key: 'value' },
      };

      const result = formatEnv(data);

      // Object should be flattened
      expect(result).toContain('NESTED_KEY=value');
    });

    it('should quote values that start with whitespace', () => {
      const data = {
        key: ' leading',
      };

      const result = formatEnv(data);

      expect(result).toContain('KEY=" leading"');
    });

    it('should quote values that end with whitespace', () => {
      const data = {
        key: 'trailing ',
      };

      const result = formatEnv(data);

      expect(result).toContain('KEY="trailing "');
    });

    it('should allow empty string values without quotes', () => {
      const data = {
        empty: '',
      };

      const result = formatEnv(data);

      expect(result).toContain('EMPTY=');
      expect(result).not.toContain('EMPTY=""');
    });

    it('should quote values with hash sign', () => {
      const data = {
        key: 'value#comment',
      };

      const result = formatEnv(data);

      expect(result).toContain('KEY="value#comment"');
    });

    it('should quote values with dollar sign', () => {
      const data = {
        key: 'value$var',
      };

      const result = formatEnv(data);

      expect(result).toContain('KEY="value$var"');
    });

    it('should escape newlines in values', () => {
      const data = {
        key: 'line1\nline2',
      };

      const result = formatEnv(data);

      expect(result).toContain('KEY="line1\\nline2"');
    });

    it('should escape backslashes in values with special chars', () => {
      // Backslashes alone don't trigger quoting, but with other special chars they get escaped
      const data = {
        key: 'path\\to\\file with space',
      };

      const result = formatEnv(data);

      expect(result).toContain('KEY="path\\\\to\\\\file with space"');
    });

    it('should not sort keys when sortKeys is false', () => {
      const data = {
        z: 'z',
        a: 'a',
      };

      const result = formatEnv(data, { sortKeys: false });
      const lines = result.trim().split('\n');

      expect(lines[0]).toContain('Z=');
      expect(lines[1]).toContain('A=');
    });

    it('should return empty string for empty data', () => {
      const result = formatEnv({});
      expect(result).toBe('');
    });

    it('should handle bigint values as string', () => {
      const data = {
        big: BigInt(12345678901234567890n),
      };

      const result = formatEnv(data);

      expect(result).toContain('BIG=');
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

    it('should skip lines without equals sign', () => {
      const content = 'KEY=value\ninvalid line\nKEY2=value2';

      const result = parseEnvContent(content);

      expect(result).toEqual({
        KEY: 'value',
        KEY2: 'value2',
      });
    });

    it('should unescape escaped characters in quoted values', () => {
      const content = 'KEY="line1\\nline2\\\\path"';

      const result = parseEnvContent(content);

      expect(result).toEqual({ KEY: 'line1\nline2\\path' });
    });

    it('should unescape escaped quotes in double-quoted values', () => {
      const content = 'KEY="has \\"quote\\" inside"';

      const result = parseEnvContent(content);

      expect(result).toEqual({ KEY: 'has "quote" inside' });
    });
  });

  describe('formatConfig', () => {
    it('should format as env when format is env', () => {
      const data = { key: 'value' };

      const result = formatConfig(data, 'env');

      expect(result).toContain('KEY=value');
    });

    it('should format as json when format is json', () => {
      const data = { key: 'value' };

      const result = formatConfig(data, 'json');

      expect(result).toContain('"key"');
      expect(result).toContain('"value"');
    });

    it('should pass options to formatEnv', () => {
      const data = { database: { host: 'localhost' } };

      const result = formatConfig(data, 'env', { separator: '__' });

      expect(result).toContain('DATABASE__HOST=localhost');
    });
  });

  describe('detectFormat edge cases', () => {
    it('should return unknown for invalid JSON starting with {', () => {
      expect(detectFormat('{ invalid json')).toBe('unknown');
    });

    it('should return unknown for invalid JSON starting with [', () => {
      expect(detectFormat('[ invalid json')).toBe('unknown');
    });

    it('should detect env format with underscore keys', () => {
      expect(detectFormat('MY_KEY=value\nOTHER_KEY=value2')).toBe('env');
    });

    it('should return unknown for lowercase env-like format', () => {
      expect(detectFormat('lowercase=value')).toBe('unknown');
    });
  });
});
