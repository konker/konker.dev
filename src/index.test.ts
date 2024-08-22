import * as momento from '@gomomento/sdk';
import * as P from '@konker.dev/effect-ts-prelude';
import { TextEncoder } from 'util';

import * as unit from './index';
import { MomentoClientDeps } from './index';

// Taken from: https://github.com/momentohq/client-sdk-javascript/blob/main/packages/client-sdk-nodejs/test/unit/cache-client.test.ts
export const TEST_MOMENTO_AUTH_TOKEN =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI';

export const ERROR_KEY = 'ERROR_KEY';
export const EXCEPTION_KEY = 'EXCEPTION_KEY';

const TEXT_ENCODER = new TextEncoder();

const TEST_KEY_1 = 'test-key-1';
const TEST_VALUE_1 = 'test-value';
const TEST_TTL_SECS = 123;

export const MockMomentoClient = jest.fn<momento.CacheClient, []>(() => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __cache: any = {};

  return {
    get: jest.fn(async (cacheName: string, key: string) => {
      console.log('KONK900', 'GET', key, __cache);
      // eslint-disable-next-line fp/no-throw
      if (key === EXCEPTION_KEY) throw new Error('GET KABOOM!');
      return key === ERROR_KEY
        ? new momento.CacheGet.Error(new momento.UnknownError('GET BOOM!'))
        : __cache[`${cacheName}_${key}`] === undefined
          ? new momento.CacheGet.Miss()
          : new momento.CacheGet.Hit(TEXT_ENCODER.encode(__cache[`${cacheName}_${key}`]));
    }),
    set: jest.fn(async (cacheName: string, key: string, value: string, _options: any) => {
      console.log('KONK900', 'SET', key, __cache);
      // eslint-disable-next-line fp/no-throw
      if (key === EXCEPTION_KEY) throw new Error('SET KABOOM!');
      if (key === ERROR_KEY) return new momento.CacheSet.Error(new momento.UnknownError('SET BOOM!'));
      __cache[`${cacheName}_${key}`] = value;
      return new momento.CacheSet.Success();
    }),
    delete: jest.fn(async (cacheName: string, key: string) => {
      console.log('KONK900', 'DEL', key, __cache);
      // eslint-disable-next-line fp/no-throw
      if (key === EXCEPTION_KEY) throw new Error('DEL KABOOM!');
      if (key === ERROR_KEY) return new momento.CacheDelete.Error(new momento.UnknownError('DEL BOOM!'));
      __cache[`${cacheName}_${key}`] = undefined;
      return new momento.CacheDelete.Success();
    }),
  } as unknown as momento.CacheClient;
});

describe('momento-client-fp', () => {
  let deps: MomentoClientDeps;

  describe('factory', () => {
    let oldEnv: NodeJS.ProcessEnv;
    beforeAll(() => {
      oldEnv = process.env;
      process.env = {
        MOMENTO_AUTH_TOKEN: TEST_MOMENTO_AUTH_TOKEN,
      };
    });
    afterAll(() => {
      process.env = oldEnv;
    });

    it('should work as expected with supplied config', () => {
      const actual = unit.defaultMomentoClientFactory(unit.DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS);
      expect(actual).toBeDefined();
      expect(P.Effect.runSync(actual())).toBeInstanceOf(momento.CacheClient);
    });

    it('should work as expected with default config', () => {
      const actual = unit.defaultMomentoClientFactory({});
      expect(actual).toBeDefined();
      expect(P.Effect.runSync(actual())).toBeInstanceOf(momento.CacheClient);
    });
  });

  describe('operations', () => {
    let momentoClient: momento.CacheClient;

    beforeEach(() => {
      momentoClient = new MockMomentoClient();
      deps = MomentoClientDeps.of({
        makeMomentoClient: () => P.Effect.succeed(momentoClient),
      });
    });

    it('should be able to get a value which does not exist', async () => {
      const actual1 = P.pipe(
        unit.MomentoGetDefaultCache('non-existing-key'),
        P.Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(P.Effect.runPromise(actual1)).resolves.toStrictEqual(P.Option.none());
    });

    it('should be able to set and get a string value', async () => {
      const actual1 = P.pipe(
        unit.MomentoSetDefaultCache(TEST_KEY_1, TEST_VALUE_1),
        P.Effect.provideService(MomentoClientDeps, deps)
      );
      const actual2 = P.pipe(unit.MomentoGetDefaultCache(TEST_KEY_1), P.Effect.provideService(MomentoClientDeps, deps));
      await expect(P.Effect.runPromise(actual1)).resolves.not.toThrow();
      await expect(P.Effect.runPromise(actual2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE_1));
    });

    it('should be able to set and get a string value with ttl', async () => {
      const actual1 = P.pipe(
        unit.MomentoSetDefaultCache(TEST_KEY_1, TEST_VALUE_1, TEST_TTL_SECS),
        P.Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(P.Effect.runPromise(actual1)).resolves.not.toThrow();
      expect((momentoClient.set as any).mock.calls[0][3]).toStrictEqual({ ttl: 123 });
    });

    it('should be able to set and delete a string value', async () => {
      const actual1 = P.pipe(
        unit.MomentoSetDefaultCache(TEST_KEY_1, TEST_VALUE_1),
        P.Effect.provideService(MomentoClientDeps, deps)
      );
      const actual2 = P.pipe(unit.MomentoGetDefaultCache(TEST_KEY_1), P.Effect.provideService(MomentoClientDeps, deps));
      const actual3 = P.pipe(unit.MomentoDelDefaultCache(TEST_KEY_1), P.Effect.provideService(MomentoClientDeps, deps));
      const actual4 = P.pipe(unit.MomentoGetDefaultCache(TEST_KEY_1), P.Effect.provideService(MomentoClientDeps, deps));
      await expect(P.Effect.runPromise(actual1)).resolves.not.toThrow();
      await expect(P.Effect.runPromise(actual2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE_1));
      await expect(P.Effect.runPromise(actual3)).resolves.not.toThrow();
      await expect(P.Effect.runPromise(actual4)).resolves.toStrictEqual(P.Option.none());
    });

    it('should throw an error from a get operation as expected', async () => {
      const actual1 = P.pipe(unit.MomentoGetDefaultCache(ERROR_KEY), P.Effect.provideService(MomentoClientDeps, deps));
      await expect(P.Effect.runPromise(actual1)).rejects.toThrow('GET BOOM!');
    });

    it('should throw an unknown error from a get operation as expected', async () => {
      const actual1 = P.pipe(
        unit.MomentoGetDefaultCache(EXCEPTION_KEY),
        P.Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(P.Effect.runPromise(actual1)).rejects.toThrow('GET KABOOM!');
    });

    it('should throw an error from a set operation as expected', async () => {
      const actual1 = P.pipe(
        unit.MomentoSetDefaultCache(ERROR_KEY, TEST_VALUE_1),
        P.Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(P.Effect.runPromise(actual1)).rejects.toThrow('SET BOOM!');
    });

    it('should throw an unknown error from a set operation as expected', async () => {
      const actual1 = P.pipe(
        unit.MomentoSetDefaultCache(EXCEPTION_KEY, TEST_VALUE_1),
        P.Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(P.Effect.runPromise(actual1)).rejects.toThrow('SET KABOOM!');
    });

    it('should throw an error from a del operation as expected', async () => {
      const actual1 = P.pipe(unit.MomentoDelDefaultCache(ERROR_KEY), P.Effect.provideService(MomentoClientDeps, deps));
      await expect(P.Effect.runPromise(actual1)).rejects.toThrow('DEL BOOM!');
    });

    it('should throw an unknown error from a del operation as expected', async () => {
      const actual1 = P.pipe(
        unit.MomentoDelDefaultCache(EXCEPTION_KEY),
        P.Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(P.Effect.runPromise(actual1)).rejects.toThrow('DEL KABOOM!');
    });
  });
});
