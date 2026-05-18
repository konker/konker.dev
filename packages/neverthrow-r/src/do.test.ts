import { okAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';

import { asks, errR, fromResultAsync, okR } from './constructors.js';
import { bindAsyncR, bindR, doAsyncR, doR } from './do.js';

describe('do-notation (sync)', () => {
  it('doR yields empty scope', () => {
    const rr = doR();
    expect(rr({})._unsafeUnwrap()).toEqual({});
  });

  it('bindR accumulates named values', () => {
    const rr = bindR('bar', ({ foo }: { foo: boolean }) => okR<string>(foo ? 'yes' : 'no'))(
      bindR('foo', () => okR<boolean>(true))(doR())
    );
    const out = rr({})._unsafeUnwrap();
    expect(out).toEqual({ foo: true, bar: 'yes' });
  });

  it('bindR threads requirements via intersection', () => {
    const rr = bindR('sum', ({ a }: { a: number }) => asks((r: { b: number }) => a + r.b))(
      bindR('a', () => asks((r: { a: number }) => r.a))(doR())
    );
    expect(rr({ a: 2, b: 3 })._unsafeUnwrap()).toEqual({ a: 2, sum: 5 });
  });

  it('bindR short-circuits on Err from earlier step', () => {
    const rr = bindR('x', () => okR<number>(1))(bindR('first', () => errR<string, number>('boom'))(doR()));
    expect(rr({})._unsafeUnwrapErr()).toBe('boom');
  });

  it('bindR short-circuits on Err from bind fn', () => {
    const rr = bindR('x', () => errR<string, number>('second-err'))(bindR('first', () => okR<number>(1))(doR()));
    expect(rr({})._unsafeUnwrapErr()).toBe('second-err');
  });
});

describe('do-notation (async)', () => {
  it('doAsyncR yields empty scope', async () => {
    const rr = doAsyncR();
    expect((await rr({}))._unsafeUnwrap()).toEqual({});
  });

  it('bindAsyncR accumulates named values', async () => {
    const rr = bindAsyncR('bar', ({ foo }: { foo: boolean }) =>
      fromResultAsync(okAsync<string, never>(foo ? 'yes' : 'no'))
    )(bindAsyncR('foo', () => fromResultAsync(okAsync<boolean, never>(false)))(doAsyncR()));
    expect((await rr({}))._unsafeUnwrap()).toEqual({ foo: false, bar: 'no' });
  });

  it('bindAsyncR threads requirements via intersection', async () => {
    const rr = bindAsyncR(
      'sum',
      ({ a }: { a: number }) =>
        (r: { b: number }) =>
          okAsync<number, never>(a + r.b)
    )(bindAsyncR('a', () => (r: { a: number }) => okAsync<number, never>(r.a))(doAsyncR()));
    expect((await rr({ a: 2, b: 3 }))._unsafeUnwrap()).toEqual({ a: 2, sum: 5 });
  });
});
