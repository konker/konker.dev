import { errAsync, okAsync } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';

import {
  andTeeAsync,
  andThenAsync,
  andThroughAsync,
  mapAsync,
  mapErrAsync,
  matchAsync,
  orElseAsync,
  orTeeAsync,
} from './async.js';
import { errAsyncR, fromResultAsync, okAsyncR } from './constructors.js';

describe('async operators', () => {
  describe('mapAsync', () => {
    it('transforms success (sync fn)', async () => {
      const rr = mapAsync((n: number) => n + 1)(okAsyncR<number>(1));
      expect((await rr({}))._unsafeUnwrap()).toBe(2);
    });
    it('transforms success (async fn)', async () => {
      const rr = mapAsync(async (n: number) => n + 1)(okAsyncR<number>(1));
      expect((await rr({}))._unsafeUnwrap()).toBe(2);
    });
    it('leaves error untouched', async () => {
      const rr = mapAsync((n: number) => n + 1)(errAsyncR<string, number>('e'));
      expect((await rr({}))._unsafeUnwrapErr()).toBe('e');
    });
  });

  describe('mapErrAsync', () => {
    it('transforms error', async () => {
      const rr = mapErrAsync((s: string) => `x:${s}`)(errAsyncR<string, number>('e'));
      expect((await rr({}))._unsafeUnwrapErr()).toBe('x:e');
    });
    it('leaves success untouched', async () => {
      const rr = mapErrAsync((s: string) => `x:${s}`)(okAsyncR<number, string>(1));
      expect((await rr({}))._unsafeUnwrap()).toBe(1);
    });
  });

  describe('andThenAsync', () => {
    it('chains with R intersection', async () => {
      const rr = andThenAsync((n: number) => fromResultAsync(okAsync<number, string>(n + 10)))(
        okAsyncR<number, string>(5)
      );
      expect((await rr({}))._unsafeUnwrap()).toBe(15);
    });
    it('short-circuits on first Err', async () => {
      const rr = andThenAsync((n: number) => okAsyncR<number, string>(n + 1))(errAsyncR<string, number>('boom'));
      expect((await rr({}))._unsafeUnwrapErr()).toBe('boom');
    });
    it('propagates Err from second step', async () => {
      const rr = andThenAsync((_n: number) => errAsyncR<string, number>('second'))(okAsyncR<number, string>(1));
      expect((await rr({}))._unsafeUnwrapErr()).toBe('second');
    });
  });

  describe('orElseAsync', () => {
    it('recovers from Err', async () => {
      const rr = orElseAsync((e: string) => okAsyncR<string>(`r:${e}`))(errAsyncR<string, string>('bad'));
      expect((await rr({}))._unsafeUnwrap()).toBe('r:bad');
    });
    it('leaves Ok untouched', async () => {
      const rr = orElseAsync((e: string) => okAsyncR<string>(`r:${e}`))(okAsyncR<string, string>('good'));
      expect((await rr({}))._unsafeUnwrap()).toBe('good');
    });
  });

  describe('matchAsync', () => {
    it('runs ok branch', async () => {
      const fn = matchAsync<number, string, string>(
        (n) => `n=${n}`,
        (e) => `e=${e}`
      );
      expect(await fn(okAsyncR<number, string>(7))({})).toBe('n=7');
    });
    it('runs err branch', async () => {
      const fn = matchAsync<number, string, string>(
        (n) => `n=${n}`,
        (e) => `e=${e}`
      );
      expect(await fn(errAsyncR<string, number>('x'))({})).toBe('e=x');
    });
  });

  describe('andTeeAsync', () => {
    it('invokes side effect on Ok', async () => {
      const spy = vi.fn();
      const rr = andTeeAsync<number>(spy)(okAsyncR<number>(1));
      expect((await rr({}))._unsafeUnwrap()).toBe(1);
      expect(spy).toHaveBeenCalledWith(1);
    });
    it('skips side effect on Err', async () => {
      const spy = vi.fn();
      const rr = andTeeAsync<number>(spy)(errAsyncR<string, number>('e'));
      expect((await rr({}))._unsafeUnwrapErr()).toBe('e');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('orTeeAsync', () => {
    it('invokes side effect on Err', async () => {
      const spy = vi.fn();
      const rr = orTeeAsync<string>(spy)(errAsyncR<string, number>('boom'));
      expect((await rr({}))._unsafeUnwrapErr()).toBe('boom');
      expect(spy).toHaveBeenCalledWith('boom');
    });
    it('skips side effect on Ok', async () => {
      const spy = vi.fn();
      const rr = orTeeAsync<string>(spy)(okAsyncR<number, string>(1));
      expect((await rr({}))._unsafeUnwrap()).toBe(1);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('andThroughAsync', () => {
    it('runs through fn and keeps original on Ok', async () => {
      const spy = vi.fn();
      const through = (n: number) => {
        spy(n);
        return fromResultAsync(okAsync<void, string>(undefined));
      };
      const rr = andThroughAsync(through)(okAsyncR<number, string>(5));
      expect((await rr({}))._unsafeUnwrap()).toBe(5);
      expect(spy).toHaveBeenCalledWith(5);
    });
    it('propagates Err from through fn', async () => {
      const through = (_n: number) => fromResultAsync(errAsync<void, string>('through-err'));
      const rr = andThroughAsync(through)(okAsyncR<number, string>(5));
      expect((await rr({}))._unsafeUnwrapErr()).toBe('through-err');
    });
    it('skips through fn on upstream Err', async () => {
      const spy = vi.fn();
      const through = (n: number) => {
        spy(n);
        return fromResultAsync(okAsync<void, string>(undefined));
      };
      const rr = andThroughAsync(through)(errAsyncR<string, number>('upstream'));
      expect((await rr({}))._unsafeUnwrapErr()).toBe('upstream');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
