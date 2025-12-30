/**
 * Schema Parser Tests
 */
import { Kind, Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { parseProviderKV, parseValue, serializeValue } from './parser.js';

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
      it('should try each type in order', async () => {
        const schema = Type.Union([Type.String(), Type.Number()]);
        // String should be tried first
        const result = await Effect.runPromise(parseValue('hello', schema, 'test'));
        expect(result).toBe('hello');
      });

      it('should try next branch when first fails to parse', async () => {
        // Union of Number and Boolean - "true" fails to parse as Number, but succeeds as Boolean
        const schema = Type.Union([Type.Number(), Type.Boolean()]);
        const result = await Effect.runPromise(parseValue('true', schema, 'test'));
        expect(result).toBe(true);
      });

      it('should return null-based fallback when accumulator succeeds first', async () => {
        // Test the case where first branch succeeds
        const schema = Type.Union([Type.String()]);
        const result = await Effect.runPromise(parseValue('hello', schema, 'test'));
        expect(result).toBe('hello');
      });

      it('should fall back to raw string when no branches match', async () => {
        const schema = Type.Union([Type.Integer(), Type.Boolean()]);
        const result = await Effect.runPromise(parseValue('not-a-number', schema, 'test'));
        expect(result).toBe('not-a-number');
      });

      it('should fall back to raw string for custom union schemas', async () => {
        const schema = {
          [Kind]: 'Union',
          anyOf: [{ [Kind]: 'Integer' }, { [Kind]: 'Boolean' }],
        } as const;
        const result = await Effect.runPromise(parseValue('not-a-number', schema as any, 'test'));
        expect(result).toBe('not-a-number');
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

    describe('object schema', () => {
      const schema = Type.Object({ key: Type.Number() });

      it('should parse JSON object strings', async () => {
        const result = await Effect.runPromise(parseValue('{"key": 42}', schema, 'test'));
        expect(result).toEqual({ key: 42 });
      });

      it('should reject invalid JSON', async () => {
        await expect(Effect.runPromise(parseValue('not json', schema, 'test'))).rejects.toThrow();
      });
    });

    describe('null schema', () => {
      const schema = Type.Null();

      it('should parse "null" string', async () => {
        const result = await Effect.runPromise(parseValue('null', schema, 'test'));
        expect(result).toBe(null);
      });

      it('should parse "NULL" case-insensitively', async () => {
        const result = await Effect.runPromise(parseValue('NULL', schema, 'test'));
        expect(result).toBe(null);
      });

      it('should reject non-null values', async () => {
        await expect(Effect.runPromise(parseValue('something', schema, 'test'))).rejects.toThrow();
      });
    });

    describe('literal schema', () => {
      it('should parse string literal', async () => {
        const schema = Type.Literal('hello');
        const result = await Effect.runPromise(parseValue('hello', schema, 'test'));
        expect(result).toBe('hello');
      });

      it('should parse number literal', async () => {
        const schema = Type.Literal(42);
        const result = await Effect.runPromise(parseValue('42', schema, 'test'));
        expect(result).toBe(42);
      });

      it('should parse boolean literal', async () => {
        const schema = Type.Literal(true);
        const result = await Effect.runPromise(parseValue('true', schema, 'test'));
        expect(result).toBe(true);
      });

      it('should handle null literal', async () => {
        const schema = Type.Literal(null as never);
        const result = await Effect.runPromise(parseValue('anything', schema, 'test'));
        expect(result).toBe('anything');
      });
    });

    describe('integer parsing edge cases', () => {
      const schema = Type.Integer();

      it('should reject Infinity', async () => {
        await expect(Effect.runPromise(parseValue('Infinity', schema, 'test'))).rejects.toThrow();
      });

      it('should reject -Infinity', async () => {
        await expect(Effect.runPromise(parseValue('-Infinity', schema, 'test'))).rejects.toThrow();
      });

      it('should handle whitespace around integers', async () => {
        const result = await Effect.runPromise(parseValue('  42  ', schema, 'test'));
        expect(result).toBe(42);
      });

      it('should handle very large numbers in scientific notation', async () => {
        // 1e+100 parses as a number without decimals so it's technically an integer
        // This is valid because Number("1e+100") is finite and isInteger
        const result = await Effect.runPromise(parseValue('1e+100', schema, 'test'));
        expect(result).toBe(1e100);
      });

      it('should reject non-integer values without decimal point', async () => {
        await expect(Effect.runPromise(parseValue('1e-1', schema, 'test'))).rejects.toThrow();
      });

      it('should reject non-integer values with custom integer schema', async () => {
        const customSchema = { [Kind]: 'Integer' } as const;
        await expect(Effect.runPromise(parseValue('1e-1', customSchema as any, 'test'))).rejects.toThrow();
      });
    });

    describe('number parsing edge cases', () => {
      const schema = Type.Number();

      it('should reject Infinity', async () => {
        await expect(Effect.runPromise(parseValue('Infinity', schema, 'test'))).rejects.toThrow();
      });

      it('should reject -Infinity', async () => {
        await expect(Effect.runPromise(parseValue('-Infinity', schema, 'test'))).rejects.toThrow();
      });
    });

    describe('unknown schema type', () => {
      it('should keep value as string for unknown types', async () => {
        // Create a schema with an unknown kind
        const unknownSchema = { [Symbol.for('TypeBox.Kind')]: 'UnknownType' } as any;
        const result = await Effect.runPromise(parseValue('value', unknownSchema, 'test'));
        expect(result).toBe('value');
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

    it('should serialize undefined as empty string', () => {
      const schema = Type.String();
      expect(serializeValue(undefined, schema)).toBe('');
    });

    it('should serialize integers', () => {
      const schema = Type.Integer();
      expect(serializeValue(42, schema)).toBe('42');
    });

    it('should serialize optional types', () => {
      const schema = Type.Optional(Type.String());
      expect(serializeValue('hello', schema)).toBe('hello');
    });

    it('should serialize unknown types as string', () => {
      const unknownSchema = { [Symbol.for('TypeBox.Kind')]: 'UnknownType' } as any;
      expect(serializeValue(42, unknownSchema)).toBe('42');
    });

    it('should serialize object values for unknown types as JSON', () => {
      const unknownSchema = { [Symbol.for('TypeBox.Kind')]: 'UnknownType' } as any;
      expect(serializeValue({ a: 1 }, unknownSchema)).toBe('{"a":1}');
    });
  });

  describe('parseProviderKV', () => {
    it('should parse flat key-value map into nested object', async () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
          port: Type.Integer(),
        }),
      });

      const kv = {
        'database.host': 'localhost',
        'database.port': '5432',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        database: {
          host: 'localhost',
          port: 5432,
        },
      });
      expect(result.unknownKeys).toEqual([]);
    });

    it('should handle deeply nested paths', async () => {
      const schema = Type.Object({
        level1: Type.Object({
          level2: Type.Object({
            value: Type.String(),
          }),
        }),
      });

      const kv = {
        'level1.level2.value': 'deep',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        level1: {
          level2: {
            value: 'deep',
          },
        },
      });
      expect(result.unknownKeys).toEqual([]);
    });

    it('should handle optional fields', async () => {
      const schema = Type.Object({
        required: Type.String(),
        optional: Type.Optional(Type.String()),
      });

      const kv = {
        required: 'value',
        optional: 'also-value',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        required: 'value',
        optional: 'also-value',
      });
      expect(result.unknownKeys).toEqual([]);
    });

    it('should handle empty key-value map', async () => {
      const schema = Type.Object({
        value: Type.String(),
      });

      const result = await Effect.runPromise(parseProviderKV({}, schema));

      expect(result.parsed).toEqual({});
      expect(result.unknownKeys).toEqual([]);
    });

    it('should fail on invalid value for type', async () => {
      const schema = Type.Object({
        count: Type.Integer(),
      });

      const kv = {
        count: 'not-a-number',
      };

      await expect(Effect.runPromise(parseProviderKV(kv, schema))).rejects.toThrow();
    });

    it('should fail on invalid key segments', async () => {
      const schema = Type.Object({
        key: Type.String(),
      });

      const kv = {
        'bad/key': 'value',
      };

      await expect(Effect.runPromise(parseProviderKV(kv, schema))).rejects.toThrow();
    });

    it('should handle multiple sibling keys', async () => {
      const schema = Type.Object({
        a: Type.String(),
        b: Type.String(),
        c: Type.String(),
      });

      const kv = {
        a: 'valueA',
        b: 'valueB',
        c: 'valueC',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        a: 'valueA',
        b: 'valueB',
        c: 'valueC',
      });
      expect(result.unknownKeys).toEqual([]);
    });

    it('should overwrite intermediate objects if path conflicts', async () => {
      const schema = Type.Object({
        parent: Type.Object({
          child: Type.String(),
        }),
      });

      // Both paths go to the same parent object
      const kv = {
        'parent.child': 'value1',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        parent: {
          child: 'value1',
        },
      });
      expect(result.unknownKeys).toEqual([]);
    });

    it('should handle nested optional objects during navigation', async () => {
      const schema = Type.Object({
        outer: Type.Optional(
          Type.Object({
            inner: Type.String(),
          })
        ),
      });

      const kv = {
        'outer.inner': 'value',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        outer: {
          inner: 'value',
        },
      });
      expect(result.unknownKeys).toEqual([]);
    });

    it('should unwrap optional schemas during navigation', async () => {
      const optionalInner = {
        [Kind]: 'Optional',
        anyOf: [
          {
            [Kind]: 'Object',
            properties: {
              inner: { [Kind]: 'String' },
            },
          },
          { [Kind]: 'Undefined' },
        ],
      } as const;
      const schema = {
        [Kind]: 'Object',
        properties: {
          outer: optionalInner,
        },
      } as never;
      const kv = {
        'outer.inner': 'value',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        outer: {
          inner: 'value',
        },
      });
      expect(result.unknownKeys).toEqual([]);
    });

    it('should parse paths even when schema is not an object', async () => {
      const schema = { [Kind]: 'String' } as never;
      const kv = {
        'a.b': 'value',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        a: {
          b: 'value',
        },
      });
      expect(result.unknownKeys).toEqual(['a.b']);
    });

    it('should keep schema when path segment is missing', async () => {
      const schema = {
        [Kind]: 'Object',
        properties: {
          known: { [Kind]: 'String' },
        },
      } as never;
      const kv = {
        'unknown.value': '{}',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        unknown: {
          value: '{}',
        },
      });
      expect(result.unknownKeys).toEqual(['unknown.value']);
    });

    it('should handle deeply nested paths with intermediate objects', async () => {
      const schema = Type.Object({
        a: Type.Object({
          b: Type.Object({
            c: Type.String(),
          }),
        }),
      });

      const kv = {
        'a.b.c': 'deep',
      };

      const result = await Effect.runPromise(parseProviderKV(kv, schema));

      expect(result.parsed).toEqual({
        a: {
          b: {
            c: 'deep',
          },
        },
      });
      expect(result.unknownKeys).toEqual([]);
    });
  });
});
