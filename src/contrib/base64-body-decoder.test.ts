import * as P from '@konker.dev/effect-ts-prelude';

import { Deps, echoCoreInDeps } from '../test/test-common';
import * as unit from './base64-body-decoder';

export type In = { body?: string; isBase64Encoded?: boolean };

const TEST_IN_1: In = { body: '{"foo":"ABC"}', isBase64Encoded: false };
const TEST_IN_2: In = { body: 'eyJmb28iOiJBQkMifQ==', isBase64Encoded: true };
const TEST_IN_3: In = { isBase64Encoded: true };
const TEST_DEPS: Deps = { bar: 'bar' };

describe('middleware/base64-body-decoder', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should work as expected with un-encoded body', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware);
    const result = P.pipe(egHandler(TEST_IN_1), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      body: '{"foo":"ABC"}',
      isBase64Encoded: false,
    });
  });

  it('should work as expected with encoded body', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware);
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      body: '{"foo":"ABC"}',
      isBase64Encoded: true,
    });
  });

  it('should work as expected with error with missing body', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware);
    const result = P.pipe(egHandler(TEST_IN_3), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      body: '',
      isBase64Encoded: true,
    });
  });

  it('should work as expected with error in decoding', async () => {
    jest.spyOn(Buffer, 'from').mockImplementation(() => {
      // eslint-disable-next-line fp/no-throw
      throw new Error('BOOM!');
    });
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware);
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).rejects.toThrow('MiddlewareError');
  });
});
