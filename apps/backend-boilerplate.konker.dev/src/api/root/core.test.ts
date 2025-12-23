/* eslint-disable fp/no-delete */
import { Effect, pipe } from 'effect';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as unit from './core.js';

describe('root/core', () => {
  beforeAll(() => {
    process.env.FOO = 'foo-value';
  });
  afterAll(() => {
    delete process.env.FOO;
  });

  it('should work as expected with basic request', () => {
    const actual = pipe(
      {
        url: '/',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        queryStringParameters: {},
        pathParameters: {},
      },
      unit.core,
      Effect.runSync
    );
    expect(actual).toStrictEqual({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: {
        apiId: 'backend-boilerplate-konker-dev',
        ip: 'UNKNOWN',
        konker: 'RULEZZ!',
        foo: 'foo-value',
        version: '0.0.2',
      },
    });
  });

  it('should work as expected with x-forwarded-for header', () => {
    const actual = pipe(
      {
        url: '/',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '123.123.123.123',
        },
        queryStringParameters: {},
        pathParameters: {},
      },
      unit.core,
      Effect.runSync
    );
    expect(actual).toStrictEqual({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: {
        apiId: 'backend-boilerplate-konker-dev',
        ip: '123.123.123.123',
        konker: expect.anything(),
        foo: 'foo-value',
        version: '0.0.2',
      },
    });
  });
});
