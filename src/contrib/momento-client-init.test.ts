import * as P from '@konker.dev/effect-ts-prelude';

import {
  DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS,
  MomentoClientDeps,
  MomentoClientFactoryDeps,
} from '@konker.dev/momento-cache-client-effect';

import { echoCoreInDeps } from '../test/test-common';
import * as unit from './momento-client-init';

export type In = { foo: 'foo' };

const clientFactoryMock = jest.fn().mockReturnValue('MOMENTO_CLIENT');

const TEST_IN: In = { foo: 'foo' };
const TEST_DEPS: MomentoClientFactoryDeps = MomentoClientFactoryDeps.of({
  momentoClientProps: DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS,
  momentoClientFactory: clientFactoryMock,
});

describe('middleware/momento-client-init', () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env = { MOMENTO_AUTH_TOKEN: 'MOMENTO_AUTH_TOKEN' };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should work as expected', async () => {
    // const result = await ruins.fromTaskEither(unit.middleware({})(echoCoreInDeps)(TEST_IN)(TEST_DEPS));
    const egHandler = P.pipe(echoCoreInDeps(MomentoClientDeps), unit.middleware({}));
    const result = await P.pipe(
      egHandler(TEST_IN),
      P.Effect.provideService(MomentoClientFactoryDeps, TEST_DEPS),
      P.Effect.runPromise
    );

    //[FIXME: is this correct? should core depend on MomentoClientDeps?]
    expect(result).toMatchObject(TEST_IN);
    expect(result).toHaveProperty('makeMomentoClient');
    expect(clientFactoryMock).toHaveBeenCalledTimes(1);
  });
});
