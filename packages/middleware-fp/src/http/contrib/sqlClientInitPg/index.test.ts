import { NodeFileSystem } from '@effect/platform-node';
import { SqlClient } from '@effect/sql/SqlClient';
import { Layer, pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { echoCoreIn200W } from '../../../test/test-common.js';
import { EMPTY_REQUEST_W } from '../../RequestW.js';
import * as unit from './index.js';
import * as unitLib from './lib.js';
import { ignoreCheckServerIdentity } from './lib.js';

// Create a mock PgDrizzle layer for testing
export const MockPgSqlClientLayer = Layer.succeed(SqlClient, {} as any);

describe('middleware/sql-client-pg-init', () => {
  describe('middleware', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should work as expected with custom layer', async () => {
      const egHandler = pipe(echoCoreIn200W, unit.middleware(undefined, undefined, MockPgSqlClientLayer));

      const result = await pipe(
        egHandler({
          ...EMPTY_REQUEST_W,
          validatedEnv: {
            DATABASE_HOST: 'string',
            DATABASE_PORT: 123,
            DATABASE_USER: 'string',
            DATABASE_PASSWORD: 'string',
            DATABASE_NAME: 'string',
          },
        }),
        Effect.provide(NodeFileSystem.layer),
        Effect.runPromise
      );

      expect(result).toMatchObject({
        body: 'OK',
        headers: {},
        in: {
          url: '/',
          headers: {},
          method: 'GET',
          pathParameters: {},
          queryStringParameters: {},
        },
        statusCode: 200,
      });
    });

    it('should work as expected with default layer', async () => {
      const spy = vi.spyOn(unitLib, 'createDefaultPgSqlClientLayer').mockReturnValue(MockPgSqlClientLayer as any);
      const egHandler = pipe(echoCoreIn200W, unit.middleware());

      const result = await pipe(
        egHandler({
          ...EMPTY_REQUEST_W,
          validatedEnv: {
            DATABASE_HOST: 'string',
            DATABASE_PORT: 123,
            DATABASE_USER: 'string',
            DATABASE_PASSWORD: 'string',
            DATABASE_NAME: 'string',
          },
        }),
        Effect.provide(NodeFileSystem.layer),
        Effect.runPromise
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined, undefined);

      expect(result).toMatchObject({
        body: 'OK',
        headers: {},
        in: {
          url: '/',
          headers: {},
          method: 'GET',
          pathParameters: {},
          queryStringParameters: {},
        },
        statusCode: 200,
      });
    });

    it('should work as expected with ca bundle file path', async () => {
      const spy = vi.spyOn(unitLib, 'createDefaultPgSqlClientLayer').mockReturnValue(MockPgSqlClientLayer as any);
      const egHandler = pipe(echoCoreIn200W, unit.middleware('/path/to/ca-bundle.pem'));

      const result = await pipe(
        egHandler({
          ...EMPTY_REQUEST_W,
          validatedEnv: {
            DATABASE_HOST: 'string',
            DATABASE_PORT: 123,
            DATABASE_USER: 'string',
            DATABASE_PASSWORD: 'string',
            DATABASE_NAME: 'string',
          },
        }),
        Effect.provide(NodeFileSystem.layer),
        Effect.runPromise
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('/path/to/ca-bundle.pem', undefined);

      expect(result).toMatchObject({
        body: 'OK',
        headers: {},
        in: {
          url: '/',
          headers: {},
          method: 'GET',
          pathParameters: {},
          queryStringParameters: {},
        },
        statusCode: 200,
      });
    });

    it('should work as expected with ca bundle file path and CheckServerIdentityFunction', async () => {
      const spy = vi.spyOn(unitLib, 'createDefaultPgSqlClientLayer').mockReturnValue(MockPgSqlClientLayer as any);
      const egHandler = pipe(echoCoreIn200W, unit.middleware('/path/to/ca-bundle.pem', ignoreCheckServerIdentity));

      const result = await pipe(
        egHandler({
          ...EMPTY_REQUEST_W,
          validatedEnv: {
            DATABASE_HOST: 'string',
            DATABASE_PORT: 123,
            DATABASE_USER: 'string',
            DATABASE_PASSWORD: 'string',
            DATABASE_NAME: 'string',
          },
        }),
        Effect.provide(NodeFileSystem.layer),
        Effect.runPromise
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('/path/to/ca-bundle.pem', ignoreCheckServerIdentity);

      expect(result).toMatchObject({
        body: 'OK',
        headers: {},
        in: {
          url: '/',
          headers: {},
          method: 'GET',
          pathParameters: {},
          queryStringParameters: {},
        },
        statusCode: 200,
      });
    });
  });
});
