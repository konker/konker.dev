import * as P from '@konker.dev/effect-ts-prelude';

import { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { mockMomentoClientFactoryDeps } from '@konker.dev/momento-cache-client-effect/dist/lib/test';

import { echoCoreInDeps } from '../test/test-common';
import * as unit from './momentoClientInit';

export type In = { foo: 'foo' };
const TEST_IN: In = { foo: 'foo' };

describe('middleware/momento-client-init', () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env = { MOMENTO_AUTH_TOKEN: 'MOMENTO_AUTH_TOKEN' };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should work as expected', async () => {
    const egHandler = P.pipe(
      echoCoreInDeps(MomentoClientDeps),
      (x) => x,
      unit.middleware({}),
      (x) => x
    );
    const result = await P.pipe(egHandler(TEST_IN), mockMomentoClientFactoryDeps(), P.Effect.runPromise);

    expect(result).toMatchObject(TEST_IN);
    expect(result).toHaveProperty('makeMomentoClient');
    // expect(clientFactoryMock).toHaveBeenCalledTimes(1);
  });
});
