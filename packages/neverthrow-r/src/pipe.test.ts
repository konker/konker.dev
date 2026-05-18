import { describe, expect, expectTypeOf, it } from 'vitest';

import { pipe } from './pipe.js';

describe('pipe', () => {
  it('returns the initial value when no functions are provided', () => {
    expect(pipe({ value: 1 })).toEqual({ value: 1 });
  });

  it('applies functions from left to right', () => {
    const result = pipe(
      2,
      (n) => n + 3,
      (n) => n * 4,
      (n) => `value=${n}`
    );

    expect(result).toBe('value=20');
  });

  it('supports twenty function arguments', () => {
    const inc = (n: number) => n + 1;

    const result = pipe(
      0,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc,
      inc
    );

    expect(result).toBe(20);
  });

  it('infers the final output type from the function chain', () => {
    const result = pipe(
      1,
      (n) => n.toString(),
      (s) => s.length > 0,
      (b) => (b ? { status: 'ok' as const } : { status: 'err' as const })
    );

    expectTypeOf(result).toEqualTypeOf<{ status: 'ok' } | { status: 'err' }>();
  });

  it('rejects incompatible adjacent function types', () => {
    const assertInvalidPipe = () => {
      pipe(
        1,
        // @ts-expect-error The second function must accept the first function's string output.
        (n: number) => n.toString(),
        (n: number) => n + 1
      );
    };

    expect(assertInvalidPipe).toBeTypeOf('function');
  });

  it('rejects more than twenty function arguments', () => {
    const inc = (n: number) => n + 1;
    const assertTooLongPipe = () => {
      pipe(
        0,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        inc,
        // @ts-expect-error Pipe overloads intentionally stop at twenty function arguments.
        inc
      );
    };

    expect(assertTooLongPipe).toBeTypeOf('function');
  });
});
