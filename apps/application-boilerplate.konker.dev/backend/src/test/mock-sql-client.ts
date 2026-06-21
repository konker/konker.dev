import { SqlClient } from '@effect/sql/SqlClient';
import { Effect, Layer } from 'effect';

export const mockSqlClient = (responseData: Array<unknown>) =>
  ({
    unsafe: (_sql: string, _params?: ReadonlyArray<unknown>) => ({
      values: Effect.succeed(responseData),
      withoutTransform: Effect.succeed([[123, 'widget-name', 42]]),
      raw: Effect.succeed({}),
    }),
  }) as unknown as SqlClient;

export const mockSqlClientLayer = (responseData: Array<unknown>) =>
  Layer.succeed(SqlClient, mockSqlClient(responseData));
