/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import { echoCoreIn } from '../test/test-common';
import * as unit from './headersValidator';

export type In = { headers: Record<string, string | undefined> };

export const testSchema = P.Schema.Struct({
  foo: P.Schema.Literal('foo_value'),
  'content-type': P.Schema.Literal('application/json'),
  num: P.Schema.NumberFromString,
});

const TEST_IN_1: In = { headers: { foo: 'foo_value', 'content-type': 'application/json', num: '123' } };
const TEST_IN_2: In = { headers: { foo: 'foo_value', 'content-type': 'text/xml' } };
const TEST_IN_3: any = {};

describe('middleware/headers-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_1), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      validatorRawHeaders: { foo: 'foo_value', 'content-type': 'application/json', num: '123' },
      headers: { foo: 'foo_value', 'content-type': 'application/json', num: 123 },
    });
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.runPromise);
    await expect(result).rejects.toThrow('Expected "application/json", actual "text/xml"');
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_3), P.Effect.runPromise);
    await expect(result).rejects.toThrow(
      'Expected { readonly foo: "foo_value"; readonly content-type: "application/json"; readonly num: NumberFromString }, actual undefined'
    );
  });
});
