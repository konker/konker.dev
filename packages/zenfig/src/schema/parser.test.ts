/**
 * Schema Parser Tests
 */
import { Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { parseValue, serializeValue } from './parser.js';

describe('parser', () => {
  describe('parseValue', () => {
    describe('string schema', () => {
      const schema = Type.String();

      it('should accept string values', async () => {
        const result = await Effect.runPromise(parseValue('hello', schema, 'test'));
        expect(result).toBe('hello');
      });

      it('should keep numeric strings as strings', async () => {
        const result = await Effect.runPromise(parseValue('123', schema, 'test'));
        expect(result).toBe('123');
      });
    });

    describe('number schema', () => {
      const schema = Type.Number();

      it('should parse integer strings', async () => {
        const result = await Effect.runPromise(parseValue('42', schema, 'test'));
        expect(result).toBe(42);
      });

      it('should parse float strings', async () => {
        const result = await Effect.runPromise(parseValue('3.14', schema, 'test'));
        expect(result).toBe(3.14);
      });

      it('should reject non-numeric strings', async () => {
        await expect(Effect.runPromise(parseValue('not-a-number', schema, 'test'))).rejects.toThrow();
      });
    });

    describe('integer schema', () => {
      const schema = Type.Integer();

      it('should parse integer strings', async () => {
        const result = await Effect.runPromise(parseValue('42', schema, 'test'));
        expect(result).toBe(42);
      });

      it('should reject float strings', async () => {
        await expect(Effect.runPromise(parseValue('3.9', schema, 'test'))).rejects.toThrow();
      });
    });

    describe('boolean schema', () => {
      const schema = Type.Boolean();

      it('should parse "true"', async () => {
        const result = await Effect.runPromise(parseValue('true', schema, 'test'));
        expect(result).toBe(true);
      });

      it('should parse "false"', async () => {
        const result = await Effect.runPromise(parseValue('false', schema, 'test'));
        expect(result).toBe(false);
      });

      it('should parse "TRUE" (case insensitive)', async () => {
        const result = await Effect.runPromise(parseValue('TRUE', schema, 'test'));
        expect(result).toBe(true);
      });

      it('should reject invalid boolean strings', async () => {
        await expect(Effect.runPromise(parseValue('maybe', schema, 'test'))).rejects.toThrow();
      });
    });

    describe('array schema', () => {
      const schema = Type.Array(Type.String());

      it('should parse JSON array strings', async () => {
        const result = await Effect.runPromise(parseValue('["a", "b", "c"]', schema, 'test'));
        expect(result).toEqual(['a', 'b', 'c']);
      });

      it('should handle empty array', async () => {
        const result = await Effect.runPromise(parseValue('[]', schema, 'test'));
        expect(result).toEqual([]);
      });
    });

    describe('union schema', () => {
      const schema = Type.Union([Type.String(), Type.Number()]);

      it('should try each type in order', async () => {
        // String should be tried first
        const result = await Effect.runPromise(parseValue('hello', schema, 'test'));
        expect(result).toBe('hello');
      });
    });

    describe('optional schema', () => {
      const schema = Type.Optional(Type.Number());

      it('should parse value normally', async () => {
        const result = await Effect.runPromise(parseValue('42', schema, 'test'));
        expect(result).toBe(42);
      });
    });

    describe('mode overrides', () => {
      const schema = Type.String(); // Schema doesn't matter when mode is specified

      it('should force string mode', async () => {
        const result = await Effect.runPromise(parseValue('42', schema, 'test', 'string'));
        expect(result).toBe('42');
      });

      it('should force int mode', async () => {
        const result = await Effect.runPromise(parseValue('42', schema, 'test', 'int'));
        expect(result).toBe(42);
      });

      it('should force float mode', async () => {
        const result = await Effect.runPromise(parseValue('3.14', schema, 'test', 'float'));
        expect(result).toBe(3.14);
      });

      it('should force bool mode', async () => {
        const result = await Effect.runPromise(parseValue('true', schema, 'test', 'bool'));
        expect(result).toBe(true);
      });

      it('should force json mode', async () => {
        const result = await Effect.runPromise(parseValue('{"key": 1}', schema, 'test', 'json'));
        expect(result).toEqual({ key: 1 });
      });
    });
  });

  describe('serializeValue', () => {
    it('should serialize strings', () => {
      const schema = Type.String();
      expect(serializeValue('hello', schema)).toBe('hello');
    });

    it('should serialize numbers', () => {
      const schema = Type.Number();
      expect(serializeValue(42, schema)).toBe('42');
      expect(serializeValue(3.14, schema)).toBe('3.14');
    });

    it('should serialize booleans', () => {
      const schema = Type.Boolean();
      expect(serializeValue(true, schema)).toBe('true');
      expect(serializeValue(false, schema)).toBe('false');
    });

    it('should serialize null', () => {
      const schema = Type.String();
      expect(serializeValue(null, schema)).toBe('');
    });

    it('should serialize arrays as JSON', () => {
      const schema = Type.Array(Type.String());
      expect(serializeValue(['a', 'b'], schema)).toBe('["a","b"]');
    });

    it('should serialize objects as JSON', () => {
      const schema = Type.Object({ x: Type.Number() });
      expect(serializeValue({ x: 1 }, schema)).toBe('{"x":1}');
    });
  });
});
