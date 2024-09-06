import * as P from '@konker.dev/effect-ts-prelude';

import { echoCoreIn } from '../test/test-common';
import * as unit from './bodyValidator';

export type In = { body: unknown };

export const testSchema = P.Schema.Struct({
  foo: P.Schema.Literal('foo_value'),
});

const TEST_IN_1: In = { body: { foo: 'foo_value' } };
const TEST_IN_2: In = { body: { foo: 'wam' } };
const TEST_IN_3: any = {};

describe('middleware/body-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_1), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      validatorRawBody: { foo: 'foo_value' },
      body: { foo: 'foo_value' },
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
    await expect(result).rejects.toThrow('Expected { readonly foo: "foo_value" }, actual undefined');
  });
});
