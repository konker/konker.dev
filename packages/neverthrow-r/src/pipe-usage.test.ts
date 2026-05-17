import { okAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';

import { andThenAsync, mapAsync } from './async.js';
import { asyncMap } from './bridges.js';
import { asks, fromResultAsync, okR } from './constructors.js';
import { bindAsyncR, bindR, doAsyncR, doR } from './do.js';
import { pipe } from './pipe.js';
import { provide, provideSome } from './provide.js';
import { andThen, map } from './sync.js';

describe('pipe-style usage (sync)', () => {
  it('threads a ResultR through a pipe of operators', () => {
    const program = pipe(
      asks((r: { base: number }) => r.base),
      map((n) => n + 1),
      andThen((n) => asks((r: { mult: number }) => n * r.mult))
    );
    const result = provide(program, { base: 4, mult: 3 });
    expect(result._unsafeUnwrap()).toBe(15);
  });

  it('terminates with provideSome for partial deps', () => {
    const program = pipe(
      okR<number>(10),
      andThen((n) => asks((r: { factor: number }) => n * r.factor))
    );
    const partial = provideSome(program, {});
    expect(partial({ factor: 2 })._unsafeUnwrap()).toBe(20);
  });

  it('builds an accumulating scope with doR + bindR', () => {
    const program = pipe(
      doR(),
      bindR('a', () => asks((r: { a: number }) => r.a)),
      bindR('b', () => asks((r: { b: number }) => r.b)),
      bindR('sum', ({ a, b }) => okR<number>(a + b))
    );
    const result = provide(program, { a: 4, b: 5 });
    expect(result._unsafeUnwrap()).toEqual({ a: 4, b: 5, sum: 9 });
  });
});

describe('pipe-style usage (async)', () => {
  it('threads a ResultAsyncR through a pipe', async () => {
    const program = pipe(
      fromResultAsync(okAsync<number, never>(2)),
      mapAsync(async (n) => n * 5),
      andThenAsync((n) => (r: { adj: number }) => okAsync<number, never>(n + r.adj))
    );
    const result = await provide(program, { adj: 1 });
    expect(result._unsafeUnwrap()).toBe(11);
  });

  it('bridges sync to async inside a pipe', async () => {
    const program = pipe(
      asks((r: { id: string }) => r.id),
      asyncMap(async (id) => `user-${id}`),
      andThenAsync((name) => fromResultAsync(okAsync<string, never>(name.toUpperCase())))
    );
    const result = await provide(program, { id: 'abc' });
    expect(result._unsafeUnwrap()).toBe('USER-ABC');
  });

  it('builds an async scope with doAsyncR + bindAsyncR', async () => {
    const program = pipe(
      doAsyncR(),
      bindAsyncR(
        'user',
        () => (r: { db: { find: (id: string) => string } }) => okAsync<string, never>(r.db.find('u1'))
      ),
      bindAsyncR('greeting', ({ user }) => fromResultAsync(okAsync<string, never>(`hi ${user}`)))
    );
    const result = await provide(program, { db: { find: (id) => `name-of-${id}` } });
    expect(result._unsafeUnwrap()).toEqual({ user: 'name-of-u1', greeting: 'hi name-of-u1' });
  });
});
