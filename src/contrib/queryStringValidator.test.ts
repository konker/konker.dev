import * as P from '@konker.dev/effect-ts-prelude';

import { echoCoreInDeps, TestDeps } from '../test/test-common';
import * as unit from './queryStringValidator';

export type In = { queryStringParameters?: any };

export const testSchema = P.Schema.Struct({
  foo: P.Schema.Literal('foo_value'),
});

const TEST_IN_1: In = { queryStringParameters: { foo: 'foo_value' } };
const TEST_IN_2: In = { queryStringParameters: { foo: 'wam' } };
const TEST_IN_3: In = {};
const TEST_DEPS: TestDeps = { bar: 'bar' };

describe('middleware/query-string-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = P.pipe(echoCoreInDeps(TestDeps), unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_1), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      validatorRawQueryStringParameters: { foo: 'foo_value' },
      queryStringParameters: { foo: 'foo_value' },
    });
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = P.pipe(echoCoreInDeps(TestDeps), unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).rejects.toThrow('Expected "foo_value", actual "wam"');
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = P.pipe(echoCoreInDeps(TestDeps), unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_3), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).rejects.toThrow('Expected { readonly foo: "foo_value" }, actual undefined');
  });
});
