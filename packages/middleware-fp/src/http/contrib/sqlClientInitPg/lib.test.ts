import { Effect, pipe } from 'effect';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import * as unit from './lib.js';

describe('middleware/sql-client-pg-init/lib', () => {
  describe('resolveSslConfig', () => {
    let _oldEnv: NodeJS.ProcessEnv;
    beforeAll(() => {
      _oldEnv = process.env;
      process.env = {};
    });
    afterEach(() => {
      process.env = {};
    });
    afterAll(() => {
      process.env = _oldEnv;
    });

    it('should work as expected with boolean value', async () => {
      process.env.DATABASE_SSL = 'true';
      const actual = await pipe(unit.resolveSslConfig(false), Effect.runPromise);

      expect(actual).toEqual(true);
    });

    it('should work as expected with record value', async () => {
      process.env.DATABASE_SSL = '{ "rejectUnauthorized": false }';
      const actual = await pipe(unit.resolveSslConfig(false), Effect.runPromise);

      expect(actual).toStrictEqual({ rejectUnauthorized: false });
    });

    it('should work as expected with default value', async () => {
      const actual = await pipe(unit.resolveSslConfig({ foo: 123 }), Effect.runPromise);

      expect(actual).toStrictEqual({ foo: 123 });
    });

    it('should work as expected with an invalid value', async () => {
      process.env.DATABASE_SSL = '123';
      const actual = async () => pipe(unit.resolveSslConfig(false), Effect.runPromise);

      await expect(actual).rejects.toThrow('Invalid data at DATABASE_SSL');
    });
  });

  describe('createDefaultPgSqlClientLayer', () => {
    it('should work as expected', async () => {
      const layer = unit.createDefaultPgSqlClientLayer();

      // TODO: better assertion?
      expect(layer).toBeDefined();
    });
  });
});
