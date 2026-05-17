import { errAsync, okAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';

import { asyncAndThen, asyncAndThrough, asyncMap } from './bridges.js';
import { errR, fromResultAsync, okR } from './constructors.js';

describe('sync→async bridges', () => {
  describe('asyncMap', () => {
    it('promotes ResultR to ResultAsyncR via async fn', async () => {
      const rr = asyncMap(async (n: number) => n * 10)(okR<number>(2));
      expect((await rr({}))._unsafeUnwrap()).toBe(20);
    });
    it('propagates upstream Err', async () => {
      const rr = asyncMap(async (n: number) => n * 10)(errR<string, number>('boom'));
      expect((await rr({}))._unsafeUnwrapErr()).toBe('boom');
    });
  });

  describe('asyncAndThen', () => {
    it('bridges and intersects R', async () => {
      const rr = asyncAndThen((n: number) => fromResultAsync(okAsync<number, string>(n + 1)))(okR<number, string>(4));
      expect((await rr({}))._unsafeUnwrap()).toBe(5);
    });
    it('short-circuits on upstream Err', async () => {
      const rr = asyncAndThen((n: number) => fromResultAsync(okAsync<number, string>(n + 1)))(
        errR<string, number>('boom')
      );
      expect((await rr({}))._unsafeUnwrapErr()).toBe('boom');
    });
    it('propagates Err from second step', async () => {
      const rr = asyncAndThen((_n: number) => fromResultAsync(errAsync<number, string>('second')))(
        okR<number, string>(1)
      );
      expect((await rr({}))._unsafeUnwrapErr()).toBe('second');
    });
  });

  describe('asyncAndThrough', () => {
    it('runs through fn and preserves original value', async () => {
      const rr = asyncAndThrough((_n: number) => fromResultAsync(okAsync<void, string>(undefined)))(
        okR<number, string>(99)
      );
      expect((await rr({}))._unsafeUnwrap()).toBe(99);
    });
    it('propagates through-fn Err', async () => {
      const rr = asyncAndThrough((_n: number) => fromResultAsync(errAsync<void, string>('through')))(
        okR<number, string>(99)
      );
      expect((await rr({}))._unsafeUnwrapErr()).toBe('through');
    });
    it('skips through-fn on upstream Err', async () => {
      const rr = asyncAndThrough((_n: number) => fromResultAsync(okAsync<void, string>(undefined)))(
        errR<string, number>('upstream')
      );
      expect((await rr({}))._unsafeUnwrapErr()).toBe('upstream');
    });
  });
});
