import * as momento from '@gomomento/sdk';
import { Option, pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import * as unit from './index.js';
import { MomentoClientDeps } from './index.js';
import { ERROR_KEY, EXCEPTION_KEY, MockMomentoClient, TEST_MOMENTO_AUTH_TOKEN } from './lib/test.js';

const TEST_KEY_1 = 'test-key-1';
const TEST_VALUE_1 = 'test-value';
const TEST_TTL_SECS = 123;

describe('momento-cache-client-effect', () => {
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
      expect(Effect.runSync(actual())).toBeInstanceOf(momento.CacheClient);
    });

    it('should work as expected with default config', () => {
      const actual = unit.defaultMomentoClientFactory({});
      expect(actual).toBeDefined();
      expect(Effect.runSync(actual())).toBeInstanceOf(momento.CacheClient);
    });
  });

  describe('operations', () => {
    let momentoClient: momento.CacheClient;

    beforeEach(() => {
      momentoClient = MockMomentoClient();
      deps = MomentoClientDeps.of({
        makeMomentoClient: () => Effect.succeed(momentoClient),
      });
    });

    it('should be able to get a value which does not exist', async () => {
      const actual1 = pipe(
        unit.MomentoGetDefaultCache('non-existing-key'),
        Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(Effect.runPromise(actual1)).resolves.toStrictEqual(Option.none());
    });

    it('should be able to set and get a string value', async () => {
      const actual1 = pipe(
        unit.MomentoSetDefaultCache(TEST_KEY_1, TEST_VALUE_1),
        Effect.provideService(MomentoClientDeps, deps)
      );
      const actual2 = pipe(unit.MomentoGetDefaultCache(TEST_KEY_1), Effect.provideService(MomentoClientDeps, deps));
      await expect(Effect.runPromise(actual1)).resolves.not.toThrow();
      await expect(Effect.runPromise(actual2)).resolves.toStrictEqual(Option.some(TEST_VALUE_1));
    });

    it('should be able to set and get a string value with ttl', async () => {
      const actual1 = pipe(
        unit.MomentoSetDefaultCache(TEST_KEY_1, TEST_VALUE_1, TEST_TTL_SECS),
        Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(Effect.runPromise(actual1)).resolves.not.toThrow();
      expect((momentoClient.set as any).mock.calls[0][3]).toStrictEqual({ ttl: 123 });
    });

    it('should be able to set and delete a string value', async () => {
      const actual1 = pipe(
        unit.MomentoSetDefaultCache(TEST_KEY_1, TEST_VALUE_1),
        Effect.provideService(MomentoClientDeps, deps)
      );
      const actual2 = pipe(unit.MomentoGetDefaultCache(TEST_KEY_1), Effect.provideService(MomentoClientDeps, deps));
      const actual3 = pipe(unit.MomentoDelDefaultCache(TEST_KEY_1), Effect.provideService(MomentoClientDeps, deps));
      const actual4 = pipe(unit.MomentoGetDefaultCache(TEST_KEY_1), Effect.provideService(MomentoClientDeps, deps));
      await expect(Effect.runPromise(actual1)).resolves.not.toThrow();
      await expect(Effect.runPromise(actual2)).resolves.toStrictEqual(Option.some(TEST_VALUE_1));
      await expect(Effect.runPromise(actual3)).resolves.not.toThrow();
      await expect(Effect.runPromise(actual4)).resolves.toStrictEqual(Option.none());
    });

    it('should throw an error from a get operation as expected', async () => {
      const actual1 = pipe(unit.MomentoGetDefaultCache(ERROR_KEY), Effect.provideService(MomentoClientDeps, deps));
      await expect(Effect.runPromise(actual1)).rejects.toThrow('GET BOOM!');
    });

    it('should throw an unknown error from a get operation as expected', async () => {
      const actual1 = pipe(unit.MomentoGetDefaultCache(EXCEPTION_KEY), Effect.provideService(MomentoClientDeps, deps));
      await expect(Effect.runPromise(actual1)).rejects.toThrow('GET KABOOM!');
    });

    it('should throw an error from a set operation as expected', async () => {
      const actual1 = pipe(
        unit.MomentoSetDefaultCache(ERROR_KEY, TEST_VALUE_1),
        Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(Effect.runPromise(actual1)).rejects.toThrow('SET BOOM!');
    });

    it('should throw an unknown error from a set operation as expected', async () => {
      const actual1 = pipe(
        unit.MomentoSetDefaultCache(EXCEPTION_KEY, TEST_VALUE_1),
        Effect.provideService(MomentoClientDeps, deps)
      );
      await expect(Effect.runPromise(actual1)).rejects.toThrow('SET KABOOM!');
    });

    it('should throw an error from a del operation as expected', async () => {
      const actual1 = pipe(unit.MomentoDelDefaultCache(ERROR_KEY), Effect.provideService(MomentoClientDeps, deps));
      await expect(Effect.runPromise(actual1)).rejects.toThrow('DEL BOOM!');
    });

    it('should throw an unknown error from a del operation as expected', async () => {
      const actual1 = pipe(unit.MomentoDelDefaultCache(EXCEPTION_KEY), Effect.provideService(MomentoClientDeps, deps));
      await expect(Effect.runPromise(actual1)).rejects.toThrow('DEL KABOOM!');
    });
  });
});
