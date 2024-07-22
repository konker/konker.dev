/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import { Deps, echoCoreInDeps } from '../test/test-common';
import * as unit from './headers-validator';

export type In = { normalizedHeaders: Record<string, string | undefined> };

export const testSchema = P.Schema.Struct({
  foo: P.Schema.Literal('foo_value'),
  'content-type': P.Schema.Literal('application/json'),
});

const TEST_IN_1: In = { normalizedHeaders: { foo: 'foo_value', 'content-type': 'application/json' } };
const TEST_IN_2: In = { normalizedHeaders: { foo: 'foo_value', 'content-type': 'text/xml' } };
const TEST_IN_3: any = {};
const TEST_DEPS: Deps = { bar: 'bar' };

describe('middleware/headers-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_1), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      normalizedHeaders: { foo: 'foo_value', 'content-type': 'application/json' },
      validatedNormalizedHeaders: { foo: 'foo_value', 'content-type': 'application/json' },
    });
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).rejects.toThrow('ParseError');
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN_3), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).rejects.toThrow('ParseError');
  });
});
