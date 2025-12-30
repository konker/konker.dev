/**
 * Effect Schema Adapter Tests
 */
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { describe, expect, it } from 'vitest';

import { ErrorCode } from '../errors.js';
import { effectAdapter } from './effect.js';

async function expectErrorCode(effect: Effect.Effect<unknown, { context?: { code?: string } }>, code: string) {
  const exit = await Effect.runPromiseExit(effect);
  expect(exit._tag).toBe('Failure');
  if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
    const error = exit.cause.error as { context?: { code?: string } };
    expect(error.context?.code).toBe(code);
  }
}

const baseSchema = Schema.Struct({
  name: Schema.String,
  database: Schema.Struct({
    host: Schema.String,
    port: Schema.Number.pipe(Schema.int(), Schema.between(1, 65535)),
  }),
  feature: Schema.Struct({
    enabled: Schema.Boolean,
  }),
  tags: Schema.Array(Schema.String),
  optionalTag: Schema.optional(Schema.String),
});

type BaseConfig = {
  name: string;
  database: {
    host: string;
    port: number;
  };
  feature: {
    enabled: boolean;
  };
  tags: ReadonlyArray<string>;
  optionalTag?: string | undefined;
};

describe('effectAdapter', () => {
  it('identifies schemas and hashes them', () => {
    expect(effectAdapter.isSchema(baseSchema)).toBe(true);
    expect(effectAdapter.isSchema({})).toBe(false);
    const hash = effectAdapter.computeSchemaHash(baseSchema);
    const hashFromAst = effectAdapter.computeSchemaHash(baseSchema.ast);
    expect(hash).toBe(hashFromAst);
    expect(hash.startsWith('sha256:')).toBe(true);
  });

  it('describes schema nodes', () => {
    expect(effectAdapter.describeNode(Schema.String)).toBe('string');
    expect(effectAdapter.describeNode(Schema.Number)).toBe('number');
    expect(effectAdapter.describeNode(Schema.Number.pipe(Schema.int()))).toBe('integer');
    expect(effectAdapter.describeNode(Schema.Boolean)).toBe('boolean');
    expect(effectAdapter.describeNode(Schema.Tuple(Schema.String, Schema.Number))).toBe('array');
    expect(effectAdapter.describeNode(Schema.Struct({}))).toBe('object');
    expect(effectAdapter.describeNode(Schema.Object)).toBe('object');
    expect(effectAdapter.describeNode(Schema.Union(Schema.String, Schema.Number))).toBe('union');
    expect(effectAdapter.describeNode(Schema.Enums({ A: 'a', B: 'b' }))).toBe('enum');
    expect(effectAdapter.describeNode(Schema.Literal('on'))).toContain('literal');
    expect(effectAdapter.describeNode(Schema.Unknown)).toBe('unknown');
    expect(effectAdapter.describeNode(Schema.Any)).toBe('any');
    expect(effectAdapter.describeNode(Schema.Union(Schema.String, Schema.Undefined))).toBe('string');
    expect(effectAdapter.describeNode(Schema.NumberFromString)).toBe('number');
    expect(effectAdapter.describeNode(Schema.suspend(() => Schema.String))).toBe('string');
  });

  it('resolves schema paths', async () => {
    const resolved = await Effect.runPromise(effectAdapter.resolvePath(baseSchema, 'database.port'));
    expect(resolved.canonicalPath).toBe('database.port');
    expect(resolved.segments).toEqual(['database', 'port']);

    await expectErrorCode(effectAdapter.resolvePath(baseSchema, 'database.missing'), ErrorCode.VAL004);
    await expectErrorCode(effectAdapter.resolvePath(baseSchema, 'name.first'), ErrorCode.VAL004);
  });

  it('collects leaf paths with optional markers', () => {
    const paths = effectAdapter.getAllLeafPaths(baseSchema);
    const optionalEntry = paths.find((entry) => entry.path === 'optionalTag');
    const nestedEntry = paths.find((entry) => entry.path === 'database.host');
    expect(optionalEntry?.isOptional).toBe(true);
    expect(nestedEntry?.isOptional).toBe(false);
  });

  it('parses values based on schema', async () => {
    expect(
      await Effect.runPromise(effectAdapter.parseValue('42', Schema.Number.pipe(Schema.int()), 'count', 'auto'))
    ).toBe(42);
    expect(await Effect.runPromise(effectAdapter.parseValue('true', Schema.Boolean, 'flag', 'auto'))).toBe(true);
    expect(await Effect.runPromise(effectAdapter.parseValue('3.14', Schema.Number, 'ratio', 'auto'))).toBe(3.14);
    expect(await Effect.runPromise(effectAdapter.parseValue('false', Schema.Literal(false), 'flag', 'auto'))).toBe(
      false
    );
    expect(await Effect.runPromise(effectAdapter.parseValue('on', Schema.Literal('on'), 'flag', 'auto'))).toBe('on');
    expect(await Effect.runPromise(effectAdapter.parseValue('5', Schema.Literal(5), 'flag', 'auto'))).toBe(5);
    expect(await Effect.runPromise(effectAdapter.parseValue('null', Schema.Literal(null), 'value', 'auto'))).toBe(null);
    await expectErrorCode(effectAdapter.parseValue('nope', Schema.Literal(null), 'value', 'auto'), ErrorCode.VAL001);

    const enumNumbers = Schema.Enums({ One: 1, Two: 2 });
    expect(await Effect.runPromise(effectAdapter.parseValue('2', enumNumbers, 'level', 'auto'))).toBe(2);
    const enumStrings = Schema.Enums({ Active: 'active', Inactive: 'inactive' });
    expect(await Effect.runPromise(effectAdapter.parseValue('active', enumStrings, 'status', 'auto'))).toBe('active');

    const tupleSchema = Schema.Tuple(Schema.String, Schema.Number);
    expect(await Effect.runPromise(effectAdapter.parseValue('["a",1]', tupleSchema, 'tuple', 'auto'))).toEqual([
      'a',
      1,
    ]);

    const objectSchema = Schema.Struct({ a: Schema.Number });
    expect(await Effect.runPromise(effectAdapter.parseValue('{"a":1}', objectSchema, 'object', 'auto'))).toEqual({
      a: 1,
    });

    const unionSchema = Schema.Union(Schema.Number, Schema.String);
    expect(await Effect.runPromise(effectAdapter.parseValue('42', unionSchema, 'value', 'auto'))).toBe(42);

    const failingUnion = Schema.Union(Schema.Number, Schema.Boolean);
    expect(await Effect.runPromise(effectAdapter.parseValue('nope', failingUnion, 'value', 'auto'))).toBe('nope');

    const constrainedUnion = Schema.Union(Schema.Number.pipe(Schema.between(1, 2)), Schema.Boolean);
    expect(await Effect.runPromise(effectAdapter.parseValue('5', constrainedUnion, 'value', 'auto'))).toBe('5');

    expect(await Effect.runPromise(effectAdapter.parseValue('data', Schema.Unknown, 'value', 'auto'))).toBe('data');
  });

  it('parses values with explicit modes', async () => {
    expect(await Effect.runPromise(effectAdapter.parseValue('text', Schema.String, 'value', 'string'))).toBe('text');
    expect(await Effect.runPromise(effectAdapter.parseValue('7', Schema.String, 'value', 'int'))).toBe(7);
    expect(await Effect.runPromise(effectAdapter.parseValue('1.5', Schema.String, 'value', 'float'))).toBe(1.5);
    expect(await Effect.runPromise(effectAdapter.parseValue('FALSE', Schema.String, 'value', 'bool'))).toBe(false);
    expect(await Effect.runPromise(effectAdapter.parseValue('{"a":1}', Schema.String, 'value', 'json'))).toEqual({
      a: 1,
    });
  });

  it('serializes values for providers', () => {
    expect(effectAdapter.serializeValue({ a: 1 }, Schema.Struct({ a: Schema.Number }))).toBe('{"a":1}');
    expect(effectAdapter.serializeValue(true, Schema.Boolean)).toBe('true');
    expect(effectAdapter.serializeValue(null, Schema.String)).toBe('');
    expect(effectAdapter.serializeValue({ a: 1 }, Schema.Unknown)).toBe('{"a":1}');
  });

  it('validates values and reports errors', async () => {
    const valid = await Effect.runPromise(
      effectAdapter.validate<BaseConfig>(
        {
          name: 'service',
          database: { host: 'localhost', port: 5432 },
          feature: { enabled: true },
          tags: ['a'],
          optionalTag: 'x',
        },
        baseSchema
      )
    );
    expect(valid.database.port).toBe(5432);

    await expectErrorCode(
      effectAdapter.validate(
        {
          name: 'service',
          database: { host: 'localhost', port: 99999 },
          feature: { enabled: true },
          tags: ['a'],
        },
        baseSchema
      ),
      ErrorCode.VAL003
    );

    await expectErrorCode(effectAdapter.validate(null, Schema.String), ErrorCode.VAL005);

    const all = await Effect.runPromise(
      effectAdapter.validateAll({ extra: 'oops' }, Schema.Struct({ required: Schema.String }))
    );
    expect(all.errors.length).toBeGreaterThan(0);
  });

  it('handles transformation failures', async () => {
    await expectErrorCode(effectAdapter.validate('nope', Schema.NumberFromString), ErrorCode.VAL001);
  });
});
