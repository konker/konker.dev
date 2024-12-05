import * as P from '@konker.dev/effect-ts-prelude';

import { echoCoreInDeps, TestDeps } from '../test/test-common';
import * as unit from './jsonBodyParser';

export type In = { body: string };
const TEST_IN_1: In = { body: '{"foo":"ABC"}' };
const TEST_IN_2: In = { body: 'NOT_JSON' };

const TEST_DEPS: TestDeps = { bar: 'bar' };

describe('middleware/json-body-parser', () => {
  it('should work as expected with default params', async () => {
    const egHandler = P.pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = P.pipe(egHandler(TEST_IN_1), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      jsonParserRawBody: '{"foo":"ABC"}',
      body: { foo: 'ABC' },
    });
  });

  it('should work as expected with bad body', async () => {
    const egHandler = P.pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).rejects.toThrow('NOT_JSON');
  });

  it('should work as expected with missing body', async () => {
    const egHandler = P.pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = P.pipe(egHandler({}), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      body: undefined,
      jsonParserRawBody: undefined,
    });
  });
});
