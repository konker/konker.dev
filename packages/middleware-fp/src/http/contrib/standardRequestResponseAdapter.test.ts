import { text } from 'node:stream/consumers';

import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { fetchRequestAllUndefined } from '../../test/fixtures/fetchRequest-allUndefined.js';
import { fetchRequestComplete } from '../../test/fixtures/fetchRequest-complete.js';
import { echoCoreIn200W, TestDepsW } from '../../test/test-common.js';
import * as unit from './standardRequestResponseAdapter.js';

const TEST_DEPS: TestDepsW = TestDepsW.of({ bar: 'bar' });

describe('middleware/standardRequestResponseAdapter', () => {
  describe('adaptFromStandardRequest', () => {
    it('should adapt StandardRequest to RequestW', async () => {
      const fetchRequestIn = fetchRequestComplete();
      const result = await pipe(unit.adaptFromStandardRequest(fetchRequestIn), Effect.runPromise);

      expect(result).toStrictEqual({
        url: 'https://example.com/test?param=value&other=test',
        method: 'POST',
        body: 'test body',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer token',
        },
        queryStringParameters: { param: 'value', other: 'test' },
        pathParameters: {},
        fetchRequestRaw: fetchRequestIn,
      });
    });

    it('should handle completely undefined headers, queryStringParameters, and pathParameters', async () => {
      const fetchRequestIn = fetchRequestAllUndefined();
      const result = await pipe(unit.adaptFromStandardRequest(fetchRequestIn), Effect.runPromise);

      expect(result).toStrictEqual({
        url: 'https://example.com/test',
        method: 'GET',
        body: '',
        headers: {},
        queryStringParameters: {},
        pathParameters: {},
        fetchRequestRaw: fetchRequestIn,
      });
    });
  });

  describe('adaptToStandardResponse', () => {
    it('should adapt ResponseW to StandardResponse', async () => {
      const responseW = {
        statusCode: 201,
        body: 'created',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const result = await pipe(unit.adaptToStandardResponse(responseW), Effect.runPromise);

      expect(result.status).toEqual(201);
      expect(await text(result.body!)).toEqual('created');
      expect(Object.fromEntries(result.headers.entries())).toStrictEqual({
        'content-type': 'application/json',
      });
    });

    it('should handle undefined body and headers', async () => {
      const responseW = {
        statusCode: 404,
      };

      const result = await pipe(unit.adaptToStandardResponse(responseW as never), Effect.runPromise);

      expect(result.status).toEqual(404);
      expect(await text(result.body!)).toEqual('');
      expect(Object.fromEntries(result.headers.entries())).toStrictEqual({});
    });
  });

  describe('middleware', () => {
    it('should work end-to-end', async () => {
      const egHandler = pipe(echoCoreIn200W, unit.middleware());
      const result = await pipe(
        egHandler(fetchRequestComplete()),
        Effect.provideService(TestDepsW, TEST_DEPS),
        Effect.runPromise
      );

      expect(result.status).toEqual(200);
      expect(await text(result.body!)).toEqual('test body');
      expect(Object.fromEntries(result.headers.entries())).toStrictEqual({
        authorization: 'Bearer token',
        'content-type': 'application/json',
      });
    });
  });
});
