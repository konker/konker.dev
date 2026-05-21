import { provide } from '@konker.dev/neverthrow-r/provide';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { errAsync, ok, okAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { andParseAsync, andParseAsyncR, andThenParseAsyncR, parseAsync } from './async.js';
import { EXCEPTION_MESSAGE, REJECTION_MESSAGE } from './common.js';

const uppercaseSchema = z.string().transform((value) => value.toUpperCase());
const asyncUppercaseSchema = z.string().transform(async (value) => value.toUpperCase());

describe('async', () => {
  describe('parseAsync', () => {
    it('parses sync schemas', async () => {
      const result = await parseAsync(uppercaseSchema)('hello');
      expect(result._unsafeUnwrap()).toBe('HELLO');
    });

    it('parses async schemas', async () => {
      const result = await parseAsync(asyncUppercaseSchema)('hello');
      expect(result._unsafeUnwrap()).toBe('HELLO');
    });

    it('accepts thenables', async () => {
      const thenable: PromiseLike<StandardSchemaV1.Result<string>> = {
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        then: (onfulfilled, onrejected) => Promise.resolve({ value: 'thenable' }).then(onfulfilled, onrejected),
      };
      const schema: StandardSchemaV1<string, string> = {
        '~standard': {
          version: 1,
          vendor: 'fixture',
          // eslint-disable-next-line @typescript-eslint/promise-function-async
          validate: () => thenable as Promise<StandardSchemaV1.Result<string>>,
        },
      };
      const result = await parseAsync(schema)('hello');
      expect(result._unsafeUnwrap()).toBe('thenable');
    });

    it('wraps rejected validations', async () => {
      const cause = new Error('nope');
      const schema: StandardSchemaV1<string, string> = {
        '~standard': {
          version: 1,
          vendor: 'fixture',
          validate: async () => {
            throw cause;
          },
        },
      };
      const result = await parseAsync(schema)('hello');
      expect(result._unsafeUnwrapErr()).toMatchObject({
        message: REJECTION_MESSAGE,
        issues: [],
        cause,
      });
    });

    it('wraps synchronous validator exceptions', async () => {
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
      const result = await parseAsync(schema)('hello');
      expect(result._unsafeUnwrapErr()).toMatchObject({
        message: EXCEPTION_MESSAGE,
        issues: [],
        cause,
      });
    });
  });

  describe('plain Result operators', () => {
    it('bridges a Result into ResultAsync', async () => {
      const result = await andParseAsync(asyncUppercaseSchema)(ok<string, never>('hello'));
      expect(result._unsafeUnwrap()).toBe('HELLO');
    });

    it('continues a ResultAsync chain', async () => {
      const result = await andParseAsync(asyncUppercaseSchema)(okAsync<string, never>('hello'));
      expect(result._unsafeUnwrap()).toBe('HELLO');
    });

    it('preserves existing async errors', async () => {
      const result = await andParseAsync(asyncUppercaseSchema)(errAsync<string, 'existing'>('existing'));
      expect(result._unsafeUnwrapErr()).toBe('existing');
    });
  });

  describe('ResultR operators', () => {
    it('bridges a ResultR into ResultAsyncR', async () => {
      const program = andParseAsyncR(asyncUppercaseSchema)((r: { value: string }) => ok<string, never>(r.value));
      const result = await provide(program, { value: 'hello' });
      expect(result._unsafeUnwrap()).toBe('HELLO');
    });

    it('continues a ResultAsyncR chain', async () => {
      const program = andThenParseAsyncR(asyncUppercaseSchema)((r: { value: string }) =>
        okAsync<string, never>(r.value)
      );
      const result = await provide(program, { value: 'hello' });
      expect(result._unsafeUnwrap()).toBe('HELLO');
    });

    it('preserves existing ResultAsyncR errors', async () => {
      const program = andThenParseAsyncR(asyncUppercaseSchema)(() => errAsync<string, 'existing'>('existing'));
      const result = await provide(program, {});
      expect(result._unsafeUnwrapErr()).toBe('existing');
    });
  });
});
