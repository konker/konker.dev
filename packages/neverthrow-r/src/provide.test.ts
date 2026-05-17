import { okAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';

import { asks, fromResultAsync, okR } from './constructors.js';
import { provide, provideSome } from './provide.js';
import { andThen } from './sync.js';

type Deps = { a: number; b: number };

describe('provide', () => {
  it('runs a ResultR with deps and returns a Result', () => {
    const rr = asks((r: Deps) => r.a + r.b);
    const res = provide(rr, { a: 2, b: 3 });
    expect(res._unsafeUnwrap()).toBe(5);
  });

  it('runs a ResultAsyncR with deps and returns a ResultAsync', async () => {
    const rr = (r: Deps) => okAsync<number, string>(r.a + r.b);
    const res = await provide(rr, { a: 1, b: 2 });
    expect(res._unsafeUnwrap()).toBe(3);
  });
});

describe('provideSome', () => {
  it('partially provides and returns a ResultR over the remaining keys', () => {
    const rr = asks((r: Deps) => r.a + r.b);
    const partial = provideSome(rr, { a: 10 });
    expect(partial({ b: 5 })._unsafeUnwrap()).toBe(15);
  });

  it('partially provides for a ResultAsyncR', async () => {
    const rr = (r: Deps) => fromResultAsync(okAsync<number, string>(r.a + r.b))(r);
    const partial = provideSome(rr, { a: 1 });
    const res = await partial({ b: 2 });
    expect(res._unsafeUnwrap()).toBe(3);
  });

  it('whole-replaces a provided key (no deep merge)', () => {
    type D = { user: { id: string; name: string } };
    const rr = asks((r: D) => `${r.user.id}/${r.user.name}`);
    const partial = provideSome(rr, { user: { id: 'x', name: 'y' } });
    expect(partial({} as Omit<D, 'user'>)._unsafeUnwrap()).toBe('x/y');
  });

  it('composes with andThen across the remaining R', () => {
    const step1 = asks((r: { a: number }) => r.a + 1);
    const step2 = (n: number) => asks((r: { b: number }) => n + r.b);
    const chain = andThen(step2)(step1);
    const partial = provideSome(chain, { a: 10 });
    expect(partial({ b: 5 })._unsafeUnwrap()).toBe(16);
  });

  it('provideSome with empty partial leaves R unchanged', () => {
    const rr = asks((r: { a: number }) => r.a);
    const partial = provideSome(rr, {});
    expect(partial({ a: 7 })._unsafeUnwrap()).toBe(7);
  });

  it('keeps okR working through provideSome (R = unknown)', () => {
    const rr = okR<number>(42);
    const partial = provideSome(rr, {});
    expect(partial({} as never)._unsafeUnwrap()).toBe(42);
  });
});
