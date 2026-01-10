import { SqlClient } from '@effect/sql/SqlClient';
import { Layer, pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it, vi } from 'vitest';

import { echoCoreIn200W } from '../../../test/test-common.js';
import { EMPTY_REQUEST_W } from '../../RequestW.js';
import * as unit from './index.js';
import * as unitLib from './lib.js';

// Create a mock PgDrizzle layer for testing
export const MockPgSqlClientLayer = Layer.succeed(SqlClient, {} as any);

describe('middleware/sql-client-pg-init', () => {
  describe('middleware', () => {
    it('should work as expected', async () => {
      const egHandler = pipe(echoCoreIn200W, unit.middleware(MockPgSqlClientLayer));

      const result = await pipe(egHandler(EMPTY_REQUEST_W), Effect.runPromise);

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
      const spy = vi.spyOn(unitLib, 'createDefaultPgSqlClientLayer').mockReturnValue(MockPgSqlClientLayer);
      const egHandler = pipe(echoCoreIn200W, unit.middleware());

      const result = await pipe(egHandler(EMPTY_REQUEST_W), Effect.runPromise);

      expect(spy).toHaveBeenCalledTimes(1);

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
