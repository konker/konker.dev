import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import * as unit from './lib.js';

export const CORRECT_TEST_VALUE = 'test-value';

describe('middleware/header-value-authorizer/lib', () => {
  it('should work as expected in an success case', async () => {
    const actual = await pipe(unit.validateHeaderValue(CORRECT_TEST_VALUE, CORRECT_TEST_VALUE), Effect.runPromise);
    expect(actual).toStrictEqual(true);
  });

  it('should work as expected in an error case', async () => {
    const actual = await pipe(unit.validateHeaderValue('banana', CORRECT_TEST_VALUE), Effect.runPromise);
    expect(actual).toStrictEqual(false);
  });

  it('should work as expected with missing header', async () => {
    const actual = await pipe(unit.validateHeaderValue(undefined, CORRECT_TEST_VALUE), Effect.runPromise);
    expect(actual).toStrictEqual(false);
  });

  it('should work as expected with missing header', async () => {
    const actual = async () => pipe(unit.validateHeaderValue(CORRECT_TEST_VALUE, undefined), Effect.runPromise);
    await expect(actual()).rejects.toThrow('Internal server error');
  });
});
