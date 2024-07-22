import * as P from '@konker.dev/effect-ts-prelude';

import { Deps, echoCoreInDeps } from '../test/test-common';
import * as unit from './json-body-parser';

export type In = { body: string };
const TEST_IN_1: In = { body: '{"foo":"ABC"}' };
const TEST_IN_2: In = { body: 'NOT_JSON' };

const TEST_DEPS: Deps = { bar: 'bar' };

describe('middleware/json-body-parser', () => {
  it('should work as expected with default params', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware);
    const result = P.pipe(egHandler(TEST_IN_1), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      body: '{"foo":"ABC"}',
      parsedBody: { foo: 'ABC' },
    });
  });

  it('should work as expected with bad body', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware);
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).rejects.toThrow('NOT_JSON');
  });

  it('should work as expected with missing body', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware);
    const result = P.pipe(egHandler({}), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).rejects.toThrow('Unexpected end of JSON input');
  });
});
