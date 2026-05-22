import { provide } from '@konker.dev/neverthrow-r/provide';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ASYNC_SCHEMA_MESSAGE, EXCEPTION_MESSAGE } from './common.js';
import { andParse, andParseR, parse } from './sync.js';

const uppercaseSchema = z.string().transform((value) => value.toUpperCase());
const asyncUppercaseSchema = z.string().transform(async (value) => value.toUpperCase());

describe('sync', () => {
  describe('parse', () => {
    it('parses with a real Standard Schema implementation', () => {
      const schema = z.string().transform((value) => Number(value));
      expect(parse(schema)('12')._unsafeUnwrap()).toBe(12);
    });

    it('returns stable messages and issue details for validation failures', () => {
      const result = parse(uppercaseSchema, { message: 'Custom validation failed' })(123 as unknown as string);
      const error = result._unsafeUnwrapErr();
      expect(error).toMatchObject({
        tag: 'SchemaValidationError',
        message: 'Custom validation failed',
      });
      expect(error.issues).toHaveLength(1);
    });

    it('passes Standard Schema validation options through', () => {
      const schema: StandardSchemaV1<string, string> = {
        '~standard': {
          version: 1,
          vendor: 'fixture',
          validate: (_value, options) => ({ value: String(options?.libraryOptions?.prefix) }),
        },
      };
      const result = parse(schema, { validationOptions: { libraryOptions: { prefix: 'ok' } } })('input');
      expect(result._unsafeUnwrap()).toBe('ok');
    });

    it('returns an async-contract error when sync parsing receives a thenable', () => {
      const result = parse(asyncUppercaseSchema)('hello');
      expect(result._unsafeUnwrapErr()).toMatchObject({
        message: ASYNC_SCHEMA_MESSAGE,
        issues: [],
      });
    });

    it('wraps synchronous validator exceptions', () => {
      const cause = new Error('boom');
      const schema: StandardSchemaV1<string, string> = {
        '~standard': {
          version: 1,
          vendor: 'fixture',
          validate: () => {
            throw cause;
          },
        },
      };
      const result = parse(schema)('hello');
      expect(result._unsafeUnwrapErr()).toMatchObject({
        message: EXCEPTION_MESSAGE,
        issues: [],
        cause,
      });
    });
  });

  describe('plain Result operators', () => {
    it('replaces the success value with parsed output', () => {
      expect(andParse(uppercaseSchema)(ok<string, never>('hello'))._unsafeUnwrap()).toBe('HELLO');
    });

    it('preserves existing errors', () => {
      expect(andParse(uppercaseSchema)(err<string, 'existing'>('existing'))._unsafeUnwrapErr()).toBe('existing');
    });
  });

  describe('ResultR operators', () => {
    it('replaces the ResultR success value with parsed output', () => {
      const program = andParseR(uppercaseSchema)((r: { value: string }) => ok<string, never>(r.value));
      expect(provide(program, { value: 'hello' })._unsafeUnwrap()).toBe('HELLO');
    });

    it('preserves existing ResultR errors', () => {
      const program = andParseR(uppercaseSchema)(() => err<string, 'existing'>('existing'));
      expect(provide(program, {})._unsafeUnwrapErr()).toBe('existing');
    });
  });
});
