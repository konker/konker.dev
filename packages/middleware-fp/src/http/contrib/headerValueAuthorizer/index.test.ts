import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { echoCoreIn200W } from '../../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../../RequestW.js';
import { middleware as responseProcessor } from '../responseProcessor.js';
import * as unit from './index.js';

// --------------------------------------------------------------------------
export const CORRECT_TEST_VALUE = 'test-value';

const TEST_IN_CORRECT = makeRequestW(EMPTY_REQUEST_W, {
  headers: { foo: CORRECT_TEST_VALUE },
});
const TEST_IN_INCORRECT = makeRequestW(EMPTY_REQUEST_W, {
  headers: { foo: 'banana' },
});
const TEST_IN_MISSING = makeRequestW(EMPTY_REQUEST_W, {
  headers: { qux: CORRECT_TEST_VALUE },
});

describe('middleware/headers-value-authorizer', () => {
  const TEST_HANDLER = pipe(
    echoCoreIn200W,
    unit.middleware({ headerName: 'foo', envVarName: 'bar' }),
    responseProcessor()
  );

  let _oldEnv: NodeJS.ProcessEnv;
  beforeEach(() => {
    _oldEnv = process.env;
    process.env = { bar: CORRECT_TEST_VALUE };
  });
  afterEach(() => {
    process.env = _oldEnv;
  });

  it('should work as expected with correct header', async () => {
    const result = pipe(TEST_HANDLER(TEST_IN_CORRECT), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: { foo: 'test-value' },
      in: {
        url: '/',
        method: 'GET',
        headers: { foo: 'test-value' },
        pathParameters: {},
        queryStringParameters: {},
      },
    });
  });

  it('should work as expected with incorrect header', async () => {
    const result = pipe(TEST_HANDLER(TEST_IN_INCORRECT), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: '{"message":"Invalid header: foo","statusCode":401}',
    });
  });

  it('should work as expected with missing header value', async () => {
    const result = pipe(TEST_HANDLER(TEST_IN_MISSING), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: '{"message":"Invalid header: foo","statusCode":401}',
    });
  });

  it('should work as expected with missing env value', async () => {
    process.env.bar = undefined;

    const result = pipe(TEST_HANDLER(TEST_IN_CORRECT), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"message":"Internal server error","statusCode":500}',
    });
  });
});
