import * as P from '@konker.dev/effect-ts-prelude';

import { echoCoreIn } from '../test/test-common';
import * as unit from './pathParametersValidator';

export type In = { pathParameters?: any };

export const testSchema = P.Schema.Struct({
  foo: P.Schema.Literal('foo_value'),
  num: P.Schema.NumberFromString,
});

const TEST_IN_1: In = { pathParameters: { foo: 'foo_value', num: '123' } };
const TEST_IN_2: In = { pathParameters: { foo: 'wam', num: '123' } };
const TEST_IN_3: In = {};

describe('middleware/path-parameters-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_1), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      validatorRawPathParameters: { foo: 'foo_value', num: '123' },
      pathParameters: { foo: 'foo_value', num: 123 },
    });
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.runPromise);
    await expect(result).rejects.toThrow('Expected "foo_value", actual "wam"');
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_3), P.Effect.runPromise);
    await expect(result).rejects.toThrow(
      'Expected { readonly foo: "foo_value"; readonly num: NumberFromString }, actual undefined'
    );
  });
});
