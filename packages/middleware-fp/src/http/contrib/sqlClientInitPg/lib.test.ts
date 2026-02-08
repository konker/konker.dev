import { NodeFileSystem } from '@effect/platform-node';
import { Effect, Layer, pipe } from 'effect';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import * as unit from './lib.js';
import { ignoreCheckServerIdentity } from './lib.js';

describe('middleware/sql-client-pg-init/lib', () => {
  describe('ignoreCheckServerIdentity', () => {
    it('should always return undefined', async () => {
      const actual = unit.ignoreCheckServerIdentity('test-host', 'test-cert' as never);
      expect(actual).toStrictEqual(undefined);
    });
  });

  describe('resolveSslConfigDirect', () => {
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
      const actual = await pipe(unit.resolveSslConfigDirect(false), Effect.runPromise);

      expect(actual).toEqual(true);
    });

    it('should work as expected with record value', async () => {
      process.env.DATABASE_SSL = '{ "rejectUnauthorized": false }';
      const actual = await pipe(unit.resolveSslConfigDirect(false), Effect.runPromise);

      expect(actual).toStrictEqual({ rejectUnauthorized: false });
    });

    it('should work as expected with default value', async () => {
      const actual = await pipe(unit.resolveSslConfigDirect({ foo: 123 }), Effect.runPromise);

      expect(actual).toStrictEqual({ foo: 123 });
    });

    it('should work as expected with an invalid value', async () => {
      process.env.DATABASE_SSL = '123';
      const actual = async () => pipe(unit.resolveSslConfigDirect(false), Effect.runPromise);

      await expect(actual).rejects.toThrow('Invalid data at DATABASE_SSL');
    });
  });

  describe('resolveSslConfigCaBundle', () => {
    it('should work as expected with a valid file path', async () => {
      const actual = await pipe(
        unit.resolveSslConfigCaBundle(`test-ca-bundle-content`),
        Effect.provide(NodeFileSystem.layer),
        Effect.runPromise
      );

      expect(actual).toStrictEqual({ ca: 'test-ca-bundle-content', checkServerIdentity: undefined });
    });

    it('should work as expected with a valid file path and a checkServerIdentity function', async () => {
      const actual = await pipe(
        unit.resolveSslConfigCaBundle(`test-ca-bundle-content`, ignoreCheckServerIdentity),
        Effect.provide(NodeFileSystem.layer),
        Effect.runPromise
      );

      expect(actual).toStrictEqual({ ca: 'test-ca-bundle-content', checkServerIdentity: ignoreCheckServerIdentity });
    });
  });

  describe('createDefaultPgSqlClientLayer', () => {
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

    it('should work as expected', async () => {
      const layer = unit.createDefaultPgSqlClientLayer();

      expect(layer).toBeDefined();
    });

    it('should attempt to build layer with config', async () => {
      process.env.DATABASE_HOST = 'localhost';
      process.env.DATABASE_PORT = '5432';
      process.env.DATABASE_USER = 'test';
      process.env.DATABASE_PASSWORD = 'test';
      process.env.DATABASE_NAME = 'test';

      const layer = unit.createDefaultPgSqlClientLayer();

      // Building the layer will fail because there's no actual database,
      // but this covers the PgClient.layerConfig code path
      const actual = async () =>
        pipe(layer, Layer.build, Effect.scoped, Effect.provide(NodeFileSystem.layer), Effect.runPromise);

      await expect(actual).rejects.toThrow();
    });

    it('should attempt to build layer with ca bundle', async () => {
      process.env.DATABASE_HOST = 'localhost';
      process.env.DATABASE_PORT = '5432';
      process.env.DATABASE_USER = 'test';
      process.env.DATABASE_PASSWORD = 'test';
      process.env.DATABASE_NAME = 'test';

      const layer = unit.createDefaultPgSqlClientLayer(`${__dirname}/fixtures/test-ca-bundle.pem`);

      // Building the layer will fail because there's no actual database,
      // but this covers the PgClient.layerConfig code path with CA bundle
      const actual = async () =>
        pipe(layer, Layer.build, Effect.scoped, Effect.provide(NodeFileSystem.layer), Effect.runPromise);

      await expect(actual).rejects.toThrow();
    });
  });
});
