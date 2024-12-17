import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreInDeps, TestDeps } from '../test/test-common.js';
import * as unit from './jsonBodyParser.js';

export type In = { body: string };
const TEST_IN_1: In = { body: '{"foo":"ABC"}' };
const TEST_IN_2: In = { body: 'NOT_JSON' };

const TEST_DEPS: TestDeps = { bar: 'bar' };

describe('middleware/json-body-parser', () => {
  it('should work as expected with default params', async () => {
    const egHandler = pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = pipe(egHandler(TEST_IN_1), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      jsonParserRawBody: '{"foo":"ABC"}',
      body: { foo: 'ABC' },
    });
  });

  it('should work as expected with bad body', async () => {
    const egHandler = pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).rejects.toThrow('NOT_JSON');
  });

  it('should work as expected with missing body', async () => {
    const egHandler = pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = pipe(egHandler({}), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      body: undefined,
      jsonParserRawBody: undefined,
    });
  });
});
