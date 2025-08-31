import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn200W, TestDepsW } from '../../test/test-common.js';
import * as unit from './standardRequestResponseAdapter.js';

const TEST_DEPS: TestDepsW = TestDepsW.of({ bar: 'bar' });

describe('middleware/standardRequestResponseAdapter', () => {
  describe('adaptFromStandardRequest', () => {
    it('should adapt a standard Request to RequestW', async () => {
      const request = new Request('https://example.com/test?param=value', {
        method: 'POST',
        body: 'test body',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
      });

      const result = await unit.adaptFromStandardRequest(request);

      expect(result).toStrictEqual({
        url: 'https://example.com/test?param=value',
        method: 'POST',
        body: 'test body',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token',
        },
        queryStringParameters: {
          param: 'value',
        },
        pathParameters: {},
      });
    });

    it('should handle empty body and no headers', async () => {
      const request = new Request('https://example.com/test');

      const result = await unit.adaptFromStandardRequest(request);

      expect(result).toStrictEqual({
        url: 'https://example.com/test',
        method: 'GET',
        body: '',
        headers: {},
        queryStringParameters: {},
        pathParameters: {},
      });
    });
  });

  describe('adaptToStandardResponse', () => {
    it('should adapt ResponseW to standard Response', () => {
      const responseW = {
        statusCode: 201,
        body: 'created',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const result = unit.adaptToStandardResponse(responseW);

      expect(result.status).toEqual(201);
      expect(result.headers.get('Content-Type')).toEqual('application/json');
    });
  });

  describe('middleware', () => {
    it('should work end-to-end', async () => {
      const request = new Request('https://example.com/test?param=value', {
        method: 'POST',
        body: 'test body',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const egHandler = pipe(echoCoreIn200W, unit.middleware());
      const result = pipe(egHandler(request), Effect.provideService(TestDepsW, TEST_DEPS), Effect.runPromise);

      await expect(result).resolves.toBeInstanceOf(Response);
      const response = await result;
      expect(response.status).toEqual(200);
    });
  });
});
