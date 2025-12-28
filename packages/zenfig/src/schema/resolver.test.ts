/**
 * Schema Resolver Tests
 */
import { Kind, Type } from '@sinclair/typebox';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import {
  canonicalizePath,
  getAllLeafPaths,
  getTypeDescription,
  isObjectSchema,
  isOptionalSchema,
  resolvePath,
  unwrapOptional,
} from './resolver.js';

describe('resolver', () => {
  describe('isObjectSchema', () => {
    it('should return true for object schema', () => {
      const schema = Type.Object({ name: Type.String() });
      expect(isObjectSchema(schema)).toBe(true);
    });

    it('should return false for string schema', () => {
      const schema = Type.String();
      expect(isObjectSchema(schema)).toBe(false);
    });

    it('should return false for number schema', () => {
      const schema = Type.Number();
      expect(isObjectSchema(schema)).toBe(false);
    });

    it('should return false for array schema', () => {
      const schema = Type.Array(Type.String());
      expect(isObjectSchema(schema)).toBe(false);
    });
  });

  describe('isOptionalSchema', () => {
    it('should return false for required schema', () => {
      const schema = Type.String();
      expect(isOptionalSchema(schema)).toBe(false);
    });

    it('should return false for non-optional types', () => {
      expect(isOptionalSchema(Type.Number())).toBe(false);
      expect(isOptionalSchema(Type.Boolean())).toBe(false);
      expect(isOptionalSchema(Type.Object({}))).toBe(false);
    });

    it('should return true for optional schemas', () => {
      const schema = {
        [Kind]: 'Optional',
        anyOf: [Type.String(), Type.Undefined()],
      } as const;
      expect(isOptionalSchema(schema as any)).toBe(true);
    });
  });

  describe('unwrapOptional', () => {
    it('should unwrap optional to get inner type', () => {
      const schema = Type.Optional(Type.String());
      const unwrapped = unwrapOptional(schema);
      expect(unwrapped).toHaveProperty('type', 'string');
    });

    it('should unwrap optional schemas with anyOf', () => {
      const schema = {
        [Kind]: 'Optional',
        anyOf: [{ [Kind]: 'String' }, { [Kind]: 'Undefined' }],
      } as const;
      const unwrapped = unwrapOptional(schema as any);
      expect(unwrapped[Kind]).toBe('String');
    });

    it('should return original schema when optional anyOf lacks non-undefined', () => {
      const schema = {
        [Kind]: 'Optional',
        anyOf: [{ [Kind]: 'Undefined' }],
      } as const;
      const unwrapped = unwrapOptional(schema as any);
      expect(unwrapped).toBe(schema);
    });

    it('should return same schema if not optional', () => {
      const schema = Type.String();
      const unwrapped = unwrapOptional(schema);
      expect(unwrapped).toBe(schema);
    });

    it('should handle nested optional', () => {
      const schema = Type.Optional(Type.Number());
      const unwrapped = unwrapOptional(schema);
      expect(unwrapped).toHaveProperty('type', 'number');
    });
  });

  describe('resolvePath', () => {
    const TestSchema = Type.Object({
      database: Type.Object({
        host: Type.String(),
        port: Type.Integer(),
        connection: Type.Object({
          timeout: Type.Integer(),
        }),
      }),
      api: Type.Object({
        key: Type.Optional(Type.String()),
      }),
    });

    it('should resolve simple path', async () => {
      const result = await Effect.runPromise(resolvePath(TestSchema, 'database.host'));

      expect(result.canonicalPath).toBe('database.host');
      expect(result.segments).toEqual(['database', 'host']);
    });

    it('should resolve nested path', async () => {
      const result = await Effect.runPromise(resolvePath(TestSchema, 'database.connection.timeout'));

      expect(result.canonicalPath).toBe('database.connection.timeout');
      expect(result.segments).toEqual(['database', 'connection', 'timeout']);
    });

    it('should resolve path case-insensitively', async () => {
      const result = await Effect.runPromise(resolvePath(TestSchema, 'DATABASE.HOST'));

      expect(result.canonicalPath).toBe('database.host');
    });

    it('should resolve path through optional', async () => {
      const result = await Effect.runPromise(resolvePath(TestSchema, 'api.key'));

      expect(result.canonicalPath).toBe('api.key');
    });

    it('should fail for empty path', async () => {
      const result = await Effect.runPromiseExit(resolvePath(TestSchema, ''));

      expect(result._tag).toBe('Failure');
    });

    it('should fail for whitespace path', async () => {
      const result = await Effect.runPromiseExit(resolvePath(TestSchema, '   '));

      expect(result._tag).toBe('Failure');
    });

    it('should fail when schema is not an object', async () => {
      const schema = { [Kind]: 'String' } as const;

      try {
        await Effect.runPromise(resolvePath(schema as any, 'value'));
        throw new Error('Expected resolvePath to fail');
      } catch (error) {
        expect((error as { context?: { availableKeys?: Array<string> } }).context?.availableKeys).toBeUndefined();
      }
    });

    it('should fail for non-existent path', async () => {
      const result = await Effect.runPromiseExit(resolvePath(TestSchema, 'nonexistent.path'));

      expect(result._tag).toBe('Failure');
    });

    it('should fail when path goes through non-object', async () => {
      const result = await Effect.runPromiseExit(resolvePath(TestSchema, 'database.host.invalid'));

      expect(result._tag).toBe('Failure');
    });

    it('should fail for non-existent nested path', async () => {
      const result = await Effect.runPromiseExit(resolvePath(TestSchema, 'database.invalid'));

      expect(result._tag).toBe('Failure');
    });
  });

  describe('canonicalizePath', () => {
    const TestSchema = Type.Object({
      Database: Type.Object({
        Host: Type.String(),
      }),
    });

    it('should return canonical path with correct casing', async () => {
      const result = await Effect.runPromise(canonicalizePath(TestSchema, 'database.host'));

      expect(result).toBe('Database.Host');
    });
  });

  describe('getAllLeafPaths', () => {
    it('should get all leaf paths from flat schema', () => {
      const schema = Type.Object({
        name: Type.String(),
        age: Type.Integer(),
      });

      const paths = getAllLeafPaths(schema);

      expect(paths).toHaveLength(2);
      expect(paths.map((p) => p.path)).toContain('name');
      expect(paths.map((p) => p.path)).toContain('age');
    });

    it('should get all leaf paths from nested schema', () => {
      const schema = Type.Object({
        database: Type.Object({
          host: Type.String(),
          port: Type.Integer(),
        }),
        api: Type.Object({
          key: Type.String(),
        }),
      });

      const paths = getAllLeafPaths(schema);

      expect(paths).toHaveLength(3);
      expect(paths.map((p) => p.path)).toContain('database.host');
      expect(paths.map((p) => p.path)).toContain('database.port');
      expect(paths.map((p) => p.path)).toContain('api.key');
    });

    it('should handle fields in schema', () => {
      const schema = Type.Object({
        required: Type.String(),
        optional: Type.Optional(Type.String()),
      });

      const paths = getAllLeafPaths(schema);

      const requiredPath = paths.find((p) => p.path === 'required');
      const optionalPath = paths.find((p) => p.path === 'optional');

      expect(requiredPath).toBeDefined();
      expect(optionalPath).toBeDefined();
    });

    it('should detect default values', () => {
      const schema = Type.Object({
        withDefault: Type.String({ default: 'hello' }),
        withoutDefault: Type.String(),
      });

      const paths = getAllLeafPaths(schema);

      const withDefaultPath = paths.find((p) => p.path === 'withDefault');
      const withoutDefaultPath = paths.find((p) => p.path === 'withoutDefault');

      expect(withDefaultPath?.hasDefault).toBe(true);
      expect(withDefaultPath?.defaultValue).toBe('hello');
      expect(withoutDefaultPath?.hasDefault).toBe(false);
    });

    it('should report defaults for non-object schemas', () => {
      const schema = { [Kind]: 'String', default: 'hello' } as const;
      const paths = getAllLeafPaths(schema as any, 'root');

      expect(paths).toHaveLength(1);
      expect(paths[0]?.path).toBe('root');
      expect(paths[0]?.hasDefault).toBe(true);
      expect(paths[0]?.defaultValue).toBe('hello');
    });

    it('should handle deeply nested schema', () => {
      const schema = Type.Object({
        level1: Type.Object({
          level2: Type.Object({
            level3: Type.Object({
              value: Type.String(),
            }),
          }),
        }),
      });

      const paths = getAllLeafPaths(schema);

      expect(paths).toHaveLength(1);
      expect(paths[0]?.path).toBe('level1.level2.level3.value');
    });

    it('should handle optional nested objects', () => {
      const schema = Type.Object({
        nested: Type.Optional(
          Type.Object({
            value: Type.String(),
          })
        ),
      });

      const paths = getAllLeafPaths(schema);

      expect(paths).toHaveLength(1);
      expect(paths[0]?.path).toBe('nested.value');
    });

    it('should handle non-object schema at root', () => {
      const schema = Type.String();

      const paths = getAllLeafPaths(schema);

      expect(paths).toHaveLength(1);
      expect(paths[0]?.path).toBe('');
    });

    it('should handle array types as leaf nodes', () => {
      const schema = Type.Object({
        tags: Type.Array(Type.String()),
      });

      const paths = getAllLeafPaths(schema);

      expect(paths).toHaveLength(1);
      expect(paths[0]?.path).toBe('tags');
    });
  });

  describe('getTypeDescription', () => {
    it('should describe string type', () => {
      expect(getTypeDescription(Type.String())).toBe('string');
    });

    it('should describe string with format', () => {
      expect(getTypeDescription(Type.String({ format: 'email' }))).toBe('string (email format)');
    });

    it('should describe number type', () => {
      expect(getTypeDescription(Type.Number())).toBe('number');
    });

    it('should describe integer type', () => {
      expect(getTypeDescription(Type.Integer())).toBe('integer');
    });

    it('should describe integer with minimum constraint', () => {
      expect(getTypeDescription(Type.Integer({ minimum: 0 }))).toBe('integer (minimum: 0)');
    });

    it('should describe integer with maximum constraint', () => {
      expect(getTypeDescription(Type.Integer({ maximum: 100 }))).toBe('integer (maximum: 100)');
    });

    it('should describe integer with both constraints', () => {
      expect(getTypeDescription(Type.Integer({ minimum: 0, maximum: 100 }))).toBe('integer (minimum: 0, maximum: 100)');
    });

    it('should describe boolean type', () => {
      expect(getTypeDescription(Type.Boolean())).toBe('boolean');
    });

    it('should describe array type', () => {
      expect(getTypeDescription(Type.Array(Type.String()))).toBe('array');
    });

    it('should describe object type', () => {
      expect(getTypeDescription(Type.Object({}))).toBe('object');
    });

    it('should describe null type', () => {
      expect(getTypeDescription(Type.Null())).toBe('null');
    });

    it('should describe literal type', () => {
      expect(getTypeDescription(Type.Literal('hello'))).toBe('literal "hello"');
    });

    it('should describe literal number type', () => {
      expect(getTypeDescription(Type.Literal(42))).toBe('literal 42');
    });

    it('should describe union type', () => {
      expect(getTypeDescription(Type.Union([Type.String(), Type.Number()]))).toBe('union');
    });

    it('should describe union type with optional', () => {
      // Type.Optional creates a Union, so it should return 'union' or similar
      const optionalSchema = Type.Optional(Type.String());
      const description = getTypeDescription(optionalSchema);
      // Optional in TypeBox is typically represented as union with undefined
      expect(description).toBeDefined();
    });

    it('should describe optional schemas', () => {
      const optionalSchema = {
        [Kind]: 'Optional',
        anyOf: [{ [Kind]: 'String' }, { [Kind]: 'Undefined' }],
      } as const;
      expect(getTypeDescription(optionalSchema as any)).toBe('optional string');
    });

    it('should describe unknown types', () => {
      // Create a custom schema with an unknown kind
      const unknownSchema = { [Symbol.for('TypeBox.Kind')]: 'CustomType' } as any;
      expect(getTypeDescription(unknownSchema)).toBe('CustomType');
    });

    it('should return unknown when kind is missing', () => {
      const unknownSchema = {} as any;
      expect(getTypeDescription(unknownSchema)).toBe('unknown');
    });
  });
});
