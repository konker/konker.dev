import * as P from '@konker.dev/effect-ts-prelude';

import * as utils from '@konker.dev/tiny-utils-fp';

import * as unit from './lib';

export const CORRECT_TEST_HMAC_VALUE = 'test-hmac-value';
export const INCORRECT_TEST_HMAC_VALUE = 'wrong-hmac-value';
export const TEST_BODY = 'test-body';
export const TEST_SECRET = 'test-secret';

describe('middleware/header-signature-authorizer/lib', () => {
  beforeEach(() => {
    jest.spyOn(utils, 'sha256HmacHex').mockReturnValue(P.Effect.succeed(CORRECT_TEST_HMAC_VALUE));
    jest.spyOn(P.Effect, 'logDebug').mockReturnValue(P.Effect.succeed(undefined));
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should work as expected in an success case', async () => {
    const result = await P.pipe(
      unit.validateHeaderSignature(CORRECT_TEST_HMAC_VALUE, TEST_BODY, TEST_SECRET),
      P.Effect.runPromise
    );

    expect(result).toStrictEqual(true);
  });

  test('it should work as expected in an error case', async () => {
    const result = await P.pipe(
      unit.validateHeaderSignature(INCORRECT_TEST_HMAC_VALUE, TEST_BODY, TEST_SECRET),
      P.Effect.runPromise
    );

    expect(result).toStrictEqual(false);
  });
});
