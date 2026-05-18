import { err, ok } from 'neverthrow';
import { describe, expect, it, vi } from 'vitest';

import { asks, errR, fromResult, okR } from './constructors.js';
import { andTee, andThen, andThrough, map, mapErr, match, orElse, orTee } from './sync.js';

describe('sync operators', () => {
  describe('map', () => {
    it('transforms the success value', () => {
      const rr = map((n: number) => n * 2)(okR<number>(3));
      expect(rr({})._unsafeUnwrap()).toBe(6);
    });
    it('leaves the error untouched', () => {
      const rr = map((n: number) => n * 2)(errR<string, number>('boom'));
      expect(rr({})._unsafeUnwrapErr()).toBe('boom');
    });
  });

  describe('mapErr', () => {
    it('transforms the error value', () => {
      const rr = mapErr((s: string) => `e:${s}`)(errR<string, number>('x'));
      expect(rr({})._unsafeUnwrapErr()).toBe('e:x');
    });
    it('leaves success untouched', () => {
      const rr = mapErr((s: string) => `e:${s}`)(okR<number, string>(1));
      expect(rr({})._unsafeUnwrap()).toBe(1);
    });
  });

  describe('andThen', () => {
    it('chains and intersects requirements', () => {
      const step1 = asks((r: { a: number }) => r.a);
      const step2 = (n: number) => asks((r: { b: number }) => n + r.b);
      const rr = andThen(step2)(step1);
      expect(rr({ a: 2, b: 3 })._unsafeUnwrap()).toBe(5);
    });
    it('short-circuits on first Err', () => {
      const rr = andThen((n: number) => okR<number>(n + 1))(errR<string, number>('boom'));
      expect(rr({})._unsafeUnwrapErr()).toBe('boom');
    });
    it('propagates Err from second step', () => {
      const rr = andThen((_n: number) => errR<string, number>('second'))(okR<number, string>(1));
      expect(rr({})._unsafeUnwrapErr()).toBe('second');
    });
  });

  describe('orElse', () => {
    it('recovers from an Err', () => {
      const rr = orElse((e: string) => okR<string>(`recovered:${e}`))(errR<string, string>('bad'));
      expect(rr({})._unsafeUnwrap()).toBe('recovered:bad');
    });
    it('leaves Ok untouched', () => {
      const rr = orElse((e: string) => okR<string>(`recovered:${e}`))(okR<string, string>('good'));
      expect(rr({})._unsafeUnwrap()).toBe('good');
    });
  });

  describe('match', () => {
    it('runs the ok branch', () => {
      const fn = match<number, string, string>(
        (n) => `n=${n}`,
        (e) => `e=${e}`
      );
      expect(fn(okR<number, string>(7))({})).toBe('n=7');
    });
    it('runs the err branch', () => {
      const fn = match<number, string, string>(
        (n) => `n=${n}`,
        (e) => `e=${e}`
      );
      expect(fn(errR<string, number>('x'))({})).toBe('e=x');
    });
  });

  describe('andTee', () => {
    it('invokes side effect on Ok and passes through', () => {
      const spy = vi.fn();
      const rr = andTee<number>(spy)(okR<number>(1));
      expect(rr({})._unsafeUnwrap()).toBe(1);
      expect(spy).toHaveBeenCalledWith(1);
    });
    it('skips side effect on Err', () => {
      const spy = vi.fn();
      const rr = andTee<number>(spy)(errR<string, number>('e'));
      expect(rr({})._unsafeUnwrapErr()).toBe('e');
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('orTee', () => {
    it('invokes side effect on Err and passes through', () => {
      const spy = vi.fn();
      const rr = orTee<string>(spy)(errR<string, number>('boom'));
      expect(rr({})._unsafeUnwrapErr()).toBe('boom');
      expect(spy).toHaveBeenCalledWith('boom');
    });
    it('skips side effect on Ok', () => {
      const spy = vi.fn();
      const rr = orTee<string>(spy)(okR<number, string>(1));
      expect(rr({})._unsafeUnwrap()).toBe(1);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('andThrough', () => {
    it('runs the through function and keeps the original value on Ok', () => {
      const spy = vi.fn();
      const through = (n: number) => {
        spy(n);
        return fromResult(ok<void, string>(undefined));
      };
      const rr = andThrough(through)(okR<number, string>(5));
      expect(rr({})._unsafeUnwrap()).toBe(5);
      expect(spy).toHaveBeenCalledWith(5);
    });
    it('propagates Err from through fn', () => {
      const through = (_n: number) => fromResult(err<void, string>('through-err'));
      const rr = andThrough(through)(okR<number, string>(5));
      expect(rr({})._unsafeUnwrapErr()).toBe('through-err');
    });
    it('skips through fn on upstream Err', () => {
      const spy = vi.fn();
      const through = (n: number) => {
        spy(n);
        return fromResult(ok<void, string>(undefined));
      };
      const rr = andThrough(through)(errR<string, number>('upstream'));
      expect(rr({})._unsafeUnwrapErr()).toBe('upstream');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
