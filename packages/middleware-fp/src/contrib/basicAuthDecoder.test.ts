import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { echoCoreIn } from '../test/test-common';
import * as unit from './basicAuthDecoder';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

// user0:secret-0
const VALID_BASIC_AUTH_VALUE = 'Basic dXNlcjA6c2VjcmV0LTA=';

const TEST_IN_1 = {
  headers: {
    authorization: VALID_BASIC_AUTH_VALUE,
  },
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

const TEST_IN_2 = {
  headers: {},
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

describe('middleware/basic-auth-decoder', () => {
  beforeEach(() => {
    vi.spyOn(Effect, 'logDebug').mockReturnValue(Effect.succeed(undefined));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected in an success case', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware());
    const result = await pipe(egHandler(TEST_IN_1), Effect.runPromise);

    expect(result).toStrictEqual({
      headers: {
        authorization: VALID_BASIC_AUTH_VALUE,
      },
      body: {},
      isBase64Encoded: false,
      userId: 'user0',
    });
  });

  it('should work as expected in an error case', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);

    await expect(result).rejects.toThrow('No token found');
  });
});
