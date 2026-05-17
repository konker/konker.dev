import { err, errAsync, ok, okAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';

import { ask, asks, errAsyncR, errR, fromResult, fromResultAsync, okAsyncR, okR } from './constructors.js';

describe('constructors', () => {
  describe('okR', () => {
    it('produces an Ok regardless of environment', () => {
      const rr = okR<number>(42);
      expect(rr({})._unsafeUnwrap()).toBe(42);
    });
  });

  describe('errR', () => {
    it('produces an Err regardless of environment', () => {
      const rr = errR<string>('boom');
      expect(rr({})._unsafeUnwrapErr()).toBe('boom');
    });
  });

  describe('okAsyncR', () => {
    it('produces a ResultAsync Ok', async () => {
      const rr = okAsyncR<number>(7);
      const r = await rr({});
      expect(r._unsafeUnwrap()).toBe(7);
    });
  });

  describe('errAsyncR', () => {
    it('produces a ResultAsync Err', async () => {
      const rr = errAsyncR<string>('nope');
      const r = await rr({});
      expect(r._unsafeUnwrapErr()).toBe('nope');
    });
  });

  describe('fromResult', () => {
    it('lifts a plain Ok Result', () => {
      const rr = fromResult(ok(1));
      expect(rr({})._unsafeUnwrap()).toBe(1);
    });
    it('lifts a plain Err Result', () => {
      const rr = fromResult(err('e'));
      expect(rr({})._unsafeUnwrapErr()).toBe('e');
    });
  });

  describe('fromResultAsync', () => {
    it('lifts an Ok ResultAsync', async () => {
      const rr = fromResultAsync(okAsync(2));
      const r = await rr({});
      expect(r._unsafeUnwrap()).toBe(2);
    });
    it('lifts an Err ResultAsync', async () => {
      const rr = fromResultAsync(errAsync('e'));
      const r = await rr({});
      expect(r._unsafeUnwrapErr()).toBe('e');
    });
  });

  describe('asks', () => {
    it('selects from the environment', () => {
      const rr = asks((r: { n: number }) => r.n + 1);
      expect(rr({ n: 5 })._unsafeUnwrap()).toBe(6);
    });
  });

  describe('ask', () => {
    it('returns the full environment', () => {
      const env = { db: 'pg', logger: 'console' };
      const rr = ask<typeof env>();
      expect(rr(env)._unsafeUnwrap()).toEqual(env);
    });
  });
});
