import * as hashUtils from '@konker.dev/tiny-utils-fp/dist/hash';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as unit from './lib';

export const CORRECT_TEST_HMAC_VALUE = 'test-hmac-value';
export const INCORRECT_TEST_HMAC_VALUE = 'wrong-hmac-value';
export const TEST_BODY = 'test-body';
export const TEST_SECRET = 'test-secret';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

describe('middleware/header-signature-authorizer/lib', () => {
  beforeEach(() => {
    vi.spyOn(hashUtils, 'sha256HmacHex').mockReturnValue(Effect.succeed(CORRECT_TEST_HMAC_VALUE));
    vi.spyOn(Effect, 'logDebug').mockReturnValue(Effect.succeed(undefined));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected in an success case', async () => {
    const result = await pipe(
      unit.validateHeaderSignature(CORRECT_TEST_HMAC_VALUE, TEST_BODY, TEST_SECRET),
      Effect.runPromise
    );

    expect(result).toStrictEqual(true);
  });

  it('should work as expected in an error case', async () => {
    const result = await pipe(
      unit.validateHeaderSignature(INCORRECT_TEST_HMAC_VALUE, TEST_BODY, TEST_SECRET),
      Effect.runPromise
    );

    expect(result).toStrictEqual(false);
  });
});
