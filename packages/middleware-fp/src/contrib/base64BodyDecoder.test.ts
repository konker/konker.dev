import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { echoCoreInDeps, TestDeps } from '../test/test-common.js';
import * as unit from './base64BodyDecoder.js';

export type In = { body?: string; isBase64Encoded?: boolean };

const TEST_IN_1: In = { body: '{"foo":"ABC"}', isBase64Encoded: false };
const TEST_IN_2: In = { body: 'eyJmb28iOiJBQkMifQ==', isBase64Encoded: true };
const TEST_IN_3: In = { isBase64Encoded: true };
const TEST_DEPS: TestDeps = { bar: 'bar' };

describe('middleware/base64-body-decoder', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected with un-encoded body', async () => {
    const egHandler = pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = pipe(egHandler(TEST_IN_1), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      body: '{"foo":"ABC"}',
      isBase64Encoded: false,
    });
  });

  it('should work as expected with encoded body', async () => {
    const egHandler = pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      body: '{"foo":"ABC"}',
      isBase64Encoded: true,
    });
  });

  it('should work as expected with error with missing body', async () => {
    const egHandler = pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = pipe(egHandler(TEST_IN_3), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      body: '',
      isBase64Encoded: true,
    });
  });

  it('should work as expected with error in decoding', async () => {
    vi.spyOn(Buffer, 'from').mockImplementation(() => {
      throw new Error('BOOM!');
    });
    const egHandler = pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).rejects.toThrow('BOOM!');
  });
});
