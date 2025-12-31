/**
 * Zod Adapter Tests
 */
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ErrorCode } from '../errors.js';
import { zodAdapter } from './zod.js';

async function expectErrorCode(effect: Effect.Effect<unknown, { context?: { code?: string } }>, code: string) {
  const exit = await Effect.runPromiseExit(effect);
  expect(exit._tag).toBe('Failure');
  if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
    const error = exit.cause.error as { context?: { code?: string } };
    expect(error.context?.code).toBe(code);
  }
}

enum DemoMode {
  Alpha = 'alpha',
  Beta = 'beta',
}

const baseSchema = z.object({
  user: z.object({
    name: z.string(),
  }),
  count: z.number(),
});

type BaseConfig = z.infer<typeof baseSchema>;

describe('zodAdapter', () => {
  it('identifies schemas and hashes them', () => {
    expect(zodAdapter.isSchema(z.string())).toBe(true);
    expect(zodAdapter.isSchema({})).toBe(false);
    const hash = zodAdapter.computeSchemaHash(z.object({ name: z.string() }));
    const scalarHash = zodAdapter.computeSchemaHash(z.string());
    expect(hash.startsWith('sha256:')).toBe(true);
    expect(scalarHash.startsWith('sha256:')).toBe(true);
  });

  it('describes schema nodes', () => {
    expect(zodAdapter.describeNode(z.string())).toBe('string');
    expect(zodAdapter.describeNode(z.number())).toBe('number');
    expect(zodAdapter.describeNode(z.number().int())).toBe('integer');
    expect(zodAdapter.describeNode(z.boolean())).toBe('boolean');
    expect(zodAdapter.describeNode(z.array(z.string()))).toBe('array');
    expect(zodAdapter.describeNode(z.object({}))).toBe('object');
    expect(zodAdapter.describeNode(z.record(z.string()))).toBe('object');
    expect(zodAdapter.describeNode(z.union([z.string(), z.number()]))).toBe('union');
    expect(zodAdapter.describeNode(z.enum(['on', 'off']))).toBe('enum');
    expect(zodAdapter.describeNode(z.nativeEnum(DemoMode))).toBe('enum');
    expect(zodAdapter.describeNode(z.literal('on'))).toContain('literal');
    expect(zodAdapter.describeNode(z.null())).toBe('null');
    expect(zodAdapter.describeNode(z.unknown())).toBe('unknown');
    expect(zodAdapter.describeNode(z.string().nullable())).toBe('string');
    expect(zodAdapter.describeNode(z.string().transform((value) => value))).toBe('string');
    expect(zodAdapter.describeNode(z.string().catch('fallback'))).toBe('string');
  });

  it('resolves schema paths', async () => {
    const resolved = await Effect.runPromise(zodAdapter.resolvePath(baseSchema, 'user.name'));
    expect(resolved.canonicalPath).toBe('user.name');

    await expectErrorCode(zodAdapter.resolvePath(baseSchema, 'user.age'), ErrorCode.VAL004);
    await expectErrorCode(zodAdapter.resolvePath(baseSchema, 'count.total'), ErrorCode.VAL004);
  });

  it('collects leaf paths with optional/default metadata', () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
      withDefault: z.string().default('hello'),
      nullable: z.string().nullable(),
      nested: z.object({
        deep: z.string().optional(),
      }),
      transformed: z.string().transform((value) => value),
      withCatch: z.string().catch('fallback'),
    });

    const paths = zodAdapter.getAllLeafPaths(schema);
    const optionalEntry = paths.find((entry) => entry.path === 'optional');
    const defaultEntry = paths.find((entry) => entry.path === 'withDefault');
    const nestedEntry = paths.find((entry) => entry.path === 'nested.deep');

    expect(optionalEntry?.isOptional).toBe(true);
    expect(defaultEntry?.hasDefault).toBe(true);
    expect(defaultEntry?.defaultValue).toBe('hello');
    expect(nestedEntry?.isOptional).toBe(true);
  });

  it('parses values based on schema', async () => {
    expect(await Effect.runPromise(zodAdapter.parseValue('text', z.string(), 'value', 'auto'))).toBe('text');
    expect(await Effect.runPromise(zodAdapter.parseValue('42', z.number().int(), 'count', 'auto'))).toBe(42);
    expect(await Effect.runPromise(zodAdapter.parseValue('false', z.boolean(), 'flag', 'auto'))).toBe(false);
    expect(await Effect.runPromise(zodAdapter.parseValue('3.14', z.number(), 'ratio', 'auto'))).toBe(3.14);
    expect(await Effect.runPromise(zodAdapter.parseValue('on', z.literal('on'), 'flag', 'auto'))).toBe('on');
    expect(await Effect.runPromise(zodAdapter.parseValue('true', z.literal(true), 'flag', 'auto'))).toBe(true);
    expect(await Effect.runPromise(zodAdapter.parseValue('5', z.literal(5), 'value', 'auto'))).toBe(5);
    expect(await Effect.runPromise(zodAdapter.parseValue('null', z.null(), 'value', 'auto'))).toBe(null);
    expect(await Effect.runPromise(zodAdapter.parseValue('null', z.literal(null), 'value', 'auto'))).toBe(null);

    const enumSchema = z.enum(['on', 'off']);
    expect(await Effect.runPromise(zodAdapter.parseValue('on', enumSchema, 'mode', 'auto'))).toBe('on');
    const nativeEnumSchema = z.nativeEnum(DemoMode);
    expect(await Effect.runPromise(zodAdapter.parseValue('alpha', nativeEnumSchema, 'mode', 'auto'))).toBe('alpha');

    const arraySchema = z.array(z.string());
    expect(await Effect.runPromise(zodAdapter.parseValue('["a"]', arraySchema, 'tags', 'auto'))).toEqual(['a']);

    const objectSchema = z.object({ a: z.number() });
    expect(await Effect.runPromise(zodAdapter.parseValue('{"a":1}', objectSchema, 'object', 'auto'))).toEqual({ a: 1 });

    const recordSchema = z.record(z.string());
    expect(await Effect.runPromise(zodAdapter.parseValue('{"a":"b"}', recordSchema, 'record', 'auto'))).toEqual({
      a: 'b',
    });

    const unionSchema = z.union([z.number(), z.string()]);
    expect(await Effect.runPromise(zodAdapter.parseValue('42', unionSchema, 'value', 'auto'))).toBe(42);

    const failingUnion = z.union([z.number(), z.boolean()]);
    expect(await Effect.runPromise(zodAdapter.parseValue('nope', failingUnion, 'value', 'auto'))).toBe('nope');

    expect(await Effect.runPromise(zodAdapter.parseValue('data', z.unknown(), 'value', 'auto'))).toBe('data');

    await expectErrorCode(zodAdapter.parseValue('nope', z.null(), 'value', 'auto'), ErrorCode.VAL001);
  });

  it('parses values with explicit modes', async () => {
    expect(await Effect.runPromise(zodAdapter.parseValue('text', z.string(), 'value', 'string'))).toBe('text');
    expect(await Effect.runPromise(zodAdapter.parseValue('7', z.string(), 'value', 'int'))).toBe(7);
    expect(await Effect.runPromise(zodAdapter.parseValue('1.5', z.string(), 'value', 'float'))).toBe(1.5);
    expect(await Effect.runPromise(zodAdapter.parseValue('TRUE', z.string(), 'value', 'bool'))).toBe(true);
    expect(await Effect.runPromise(zodAdapter.parseValue('{"a":1}', z.string(), 'value', 'json'))).toEqual({ a: 1 });
  });

  it('serializes values for providers', () => {
    expect(zodAdapter.serializeValue({ a: 1 }, z.object({ a: z.number() }))).toBe('{"a":1}');
    expect(zodAdapter.serializeValue(true, z.boolean())).toBe('true');
    expect(zodAdapter.serializeValue('hello', z.string())).toBe('hello');
    expect(zodAdapter.serializeValue(3, z.number())).toBe('3');
    expect(zodAdapter.serializeValue(null, z.string())).toBe('');
    expect(zodAdapter.serializeValue({ a: 1 }, z.unknown())).toBe('{"a":1}');
  });

  it('validates values and maps errors', async () => {
    const valid = await Effect.runPromise(
      zodAdapter.validate<BaseConfig>({ user: { name: 'ok' }, count: 1 }, baseSchema)
    );
    expect(valid.user.name).toBe('ok');

    const cases: Array<{ schema: z.ZodTypeAny; value: unknown; code: string }> = [
      { schema: z.string(), value: null, code: ErrorCode.VAL005 },
      { schema: z.string().email(), value: 'nope', code: ErrorCode.VAL002 },
      { schema: z.string().regex(/abc/), value: 'nope', code: ErrorCode.VAL003 },
      { schema: z.number().min(5), value: 1, code: ErrorCode.VAL003 },
      { schema: z.number().max(5), value: 10, code: ErrorCode.VAL003 },
      { schema: z.enum(['a', 'b']), value: 'c', code: ErrorCode.VAL003 },
      { schema: z.object({ a: z.string() }).strict(), value: { a: 'x', extra: 'y' }, code: ErrorCode.VAL003 },
      { schema: z.union([z.number(), z.boolean()]), value: 'nope', code: ErrorCode.VAL001 },
      {
        schema: z.string().superRefine((_value, ctx) => {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'nope' });
        }),
        value: 'x',
        code: ErrorCode.VAL003,
      },
    ];

    for (const testCase of cases) {
      await expectErrorCode(zodAdapter.validate(testCase.value, testCase.schema), testCase.code);
    }

    const fakeSchema = {
      safeParse: () => ({ success: false, error: { issues: [] as Array<unknown> } }),
    } as unknown as z.ZodTypeAny;
    await expectErrorCode(zodAdapter.validate('value', fakeSchema), ErrorCode.VAL003);
  });

  it('returns all validation errors', async () => {
    const result = await Effect.runPromise(
      zodAdapter.validateAll(
        { user: { name: 'ok' } },
        z.object({ user: z.object({ name: z.string(), age: z.number() }) })
      )
    );
    expect(result.errors.length).toBeGreaterThan(0);
    const success = await Effect.runPromise(
      zodAdapter.validateAll(
        { user: { name: 'ok', age: 20 } },
        z.object({ user: z.object({ name: z.string(), age: z.number() }) })
      )
    );
    expect(success.errors.length).toBe(0);
  });
});
