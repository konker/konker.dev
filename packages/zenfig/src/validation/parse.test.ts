/**
 * Validation Parse Helpers Tests
 */
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { ErrorCode } from '../errors.js';
import { parseBoolean, parseInteger, parseJson, parseNumber } from './parse.js';

async function expectErrorCode(effect: Effect.Effect<unknown, { context?: { code?: string } }>, code: string) {
  const exit = await Effect.runPromiseExit(effect);
  expect(exit._tag).toBe('Failure');
  if (exit._tag === 'Failure' && exit.cause._tag === 'Fail') {
    const error = exit.cause.error as { context?: { code?: string } };
    expect(error.context?.code).toBe(code);
  }
}

describe('parse helpers', () => {
  it('parses booleans', async () => {
    expect(await Effect.runPromise(parseBoolean('TRUE', 'flag'))).toBe(true);
    expect(await Effect.runPromise(parseBoolean('false', 'flag'))).toBe(false);
  });

  it('rejects invalid booleans', async () => {
    await expectErrorCode(parseBoolean('yes', 'flag'), ErrorCode.VAL001);
  });

  it('parses integers', async () => {
    expect(await Effect.runPromise(parseInteger(' 42 ', 'count'))).toBe(42);
  });

  it('rejects invalid integers', async () => {
    await expectErrorCode(parseInteger('1.5', 'count'), ErrorCode.VAL001);
    await expectErrorCode(parseInteger('abc', 'count'), ErrorCode.VAL001);
    await expectErrorCode(parseInteger('Infinity', 'count'), ErrorCode.VAL001);
    await expectErrorCode(parseInteger('1e-3', 'count'), ErrorCode.VAL001);
  });

  it('parses numbers', async () => {
    expect(await Effect.runPromise(parseNumber('3.14', 'ratio'))).toBe(3.14);
  });

  it('rejects invalid numbers', async () => {
    await expectErrorCode(parseNumber('not-a-number', 'ratio'), ErrorCode.VAL001);
    await expectErrorCode(parseNumber('Infinity', 'ratio'), ErrorCode.VAL001);
  });

  it('parses JSON values', async () => {
    expect(await Effect.runPromise(parseJson('{"a":1}', 'payload', 'JSON'))).toEqual({ a: 1 });
  });

  it('rejects invalid JSON', async () => {
    await expectErrorCode(parseJson('{oops}', 'payload', 'JSON'), ErrorCode.VAL001);
  });
});
