import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { apiGatewayProxyEventV2AllUndefined } from '../../test/fixtures/apiGatewayProxyEventV2-allUndefined.js';
import { apiGatewayProxyEventV2Complete } from '../../test/fixtures/apiGatewayProxyEventV2-complete.js';
import { apiGatewayProxyEventV2EndToEnd } from '../../test/fixtures/apiGatewayProxyEventV2-endToEnd.js';
import { apiGatewayProxyEventV2WithUndefined } from '../../test/fixtures/apiGatewayProxyEventV2-withUndefined.js';
import { echoCoreIn200W, TestDepsW } from '../../test/test-common.js';
import * as unit from './apiGatewayProxyEventV2Adapter.js';

const TEST_DEPS: TestDepsW = TestDepsW.of({ bar: 'bar' });

describe('middleware/apiGatewayProxyEventV2Adapter', () => {
  describe('adaptFromApiGatewayProxyEventV2', () => {
    it('should adapt APIGatewayProxyEventV2 to RequestW', () => {
      const result = unit.adaptFromApiGatewayProxyEventV2(apiGatewayProxyEventV2Complete);

      expect(result).toStrictEqual({
        url: '/test',
        method: 'POST',
        body: 'test body',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token',
        },
        queryStringParameters: {
          param: 'value',
          other: 'test',
        },
        pathParameters: {
          id: '123',
        },
      });
    });

    it('should handle undefined values by converting them to empty strings', () => {
      const result = unit.adaptFromApiGatewayProxyEventV2(apiGatewayProxyEventV2WithUndefined);

      expect(result).toStrictEqual({
        url: '/test',
        method: 'GET',
        body: '',
        headers: {
          'content-type': 'application/json',
          'x-custom': '',
        },
        queryStringParameters: {
          param: 'value',
          empty: '',
        },
        pathParameters: {
          id: '123',
          missing: '',
        },
      });
    });

    it('should handle completely undefined headers, queryStringParameters, and pathParameters', () => {
      const result = unit.adaptFromApiGatewayProxyEventV2(apiGatewayProxyEventV2AllUndefined as never);

      expect(result).toStrictEqual({
        url: '/test',
        method: 'GET',
        body: '',
        headers: {},
        queryStringParameters: {},
        pathParameters: {},
      });
    });
  });

  describe('adaptToApiGatewayProxyResult', () => {
    it('should adapt ResponseW to APIGatewayProxyResult', () => {
      const responseW = {
        statusCode: 201,
        body: 'created',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const result = unit.adaptToApiGatewayProxyResult(responseW);

      expect(result).toStrictEqual({
        statusCode: 201,
        body: 'created',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle undefined body and headers', () => {
      const responseW = {
        statusCode: 404,
      };

      const result = unit.adaptToApiGatewayProxyResult(responseW as never);

      expect(result).toStrictEqual({
        statusCode: 404,
        body: '',
        headers: {},
      });
    });
  });

  describe('middleware', () => {
    it('should work end-to-end', async () => {
      const egHandler = pipe(echoCoreIn200W, unit.middleware());
      const result = pipe(
        egHandler(apiGatewayProxyEventV2EndToEnd),
        Effect.provideService(TestDepsW, TEST_DEPS),
        Effect.runPromise
      );

      await expect(result).resolves.toStrictEqual({
        statusCode: 200,
        body: 'test body',
        headers: {
          'content-type': 'application/json',
        },
      });
    });
  });
});
