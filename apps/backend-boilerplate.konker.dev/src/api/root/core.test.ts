import * as M from '@konker.dev/middleware-fp/http/contrib';
import { Effect, pipe } from 'effect';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { mockSqlClientLayer } from '../../test/mock-sql-client.js';
import * as unit from './core.js';

describe('root/core', () => {
  let oldEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    oldEnv = process.env;
    process.env = { FOO: 'foo-value' };
  });
  afterAll(() => {
    process.env = oldEnv;
  });

  it('should work as expected with basic request', async () => {
    const testData = [[123, 'widget-name', 42]];
    const stack = pipe(unit.core, M.sqlClientInitPg.middleware(mockSqlClientLayer(testData)));

    const actual = await pipe(
      {
        url: '/',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        queryStringParameters: {},
        pathParameters: {},
        validatedEnv: {
          DATABASE_HOST: 'database_host',
          DATABASE_PORT: 1234,
          DATABASE_USER: 'database_username',
          DATABASE_PASSWORD: 'database_password',
          DATABASE_NAME: 'database_dbname',
          DATABASE_SSL: true,
        },
      },
      stack,
      Effect.runPromise
    );
    expect(actual).toStrictEqual({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: {
        apiId: 'backend-boilerplate-konker-dev',
        version: '0.0.2',
        ip: 'UNKNOWN',
        konker: 'RULEZZ!',
        foo: 'foo-value',
        DATABASE_NAME: 'database_dbname',
        DATABASE_PORT: 1234,
        result: [{ id: 123, name: 'widget-name', size: 42 }],
      },
    });
  });

  it('should work as expected with x-forwarded-for header', async () => {
    const testData = [[123, 'widget-name', 42]];
    const stack = pipe(unit.core, M.sqlClientInitPg.middleware(mockSqlClientLayer(testData)));

    const actual = await pipe(
      {
        url: '/',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '123.123.123.123',
        },
        queryStringParameters: {},
        pathParameters: {},
        validatedEnv: {
          DATABASE_HOST: 'database_host',
          DATABASE_PORT: 1234,
          DATABASE_USER: 'database_username',
          DATABASE_PASSWORD: 'database_password',
          DATABASE_NAME: 'database_dbname',
          DATABASE_SSL: true,
        },
      },
      stack,
      Effect.runPromise
    );
    expect(actual).toStrictEqual({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: {
        apiId: 'backend-boilerplate-konker-dev',
        version: '0.0.2',
        ip: '123.123.123.123',
        konker: expect.anything(),
        foo: 'foo-value',
        DATABASE_NAME: 'database_dbname',
        DATABASE_PORT: 1234,
        result: [{ id: 123, name: 'widget-name', size: 42 }],
      },
    });
  });
});
