import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './http.js';
import { EMPTY_REQUEST_W, EMPTY_RESPONSE_W } from './http.js';

describe('lib/http-std', () => {
  describe('UNKNOWN_STRING_EFFECT', () => {
    it('should work as expected', () => {
      expect(Effect.runSync(unit.UNKNOWN_STRING_EFFECT())).toStrictEqual('UNKNOWN');
    });
  });

  describe('makeRequestW', () => {
    const TEST_REQUEST_W_1 = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      pathParameters: {
        id: 'abc123',
      },
      queryStringParameters: {
        page: '123',
      },
    };

    it('should work with empty request and without extra properties', () => {
      expect(unit.makeRequestW(EMPTY_REQUEST_W)).toStrictEqual({
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
      });
    });

    it('should work with request and without extra properties', () => {
      expect(unit.makeRequestW(TEST_REQUEST_W_1)).toStrictEqual(TEST_REQUEST_W_1);
    });

    it('should work with empty request and with extra properties', () => {
      expect(unit.makeRequestW(EMPTY_REQUEST_W, { foo: 'bar' })).toStrictEqual({
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        foo: 'bar',
      });
    });

    it('should work with request and with extra properties', () => {
      expect(unit.makeRequestW(TEST_REQUEST_W_1, { foo: 'bar' })).toStrictEqual({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        pathParameters: {
          id: 'abc123',
        },
        queryStringParameters: {
          page: '123',
        },
        foo: 'bar',
      });
    });

    it('should work with request and with extra properties which override base properties', () => {
      expect(
        unit.makeRequestW(TEST_REQUEST_W_1, { foo: 'bar', headers: { 'content-type': 'text/xml' } })
      ).toStrictEqual({
        method: 'POST',
        headers: {
          'content-type': 'text/xml',
        },
        pathParameters: {
          id: 'abc123',
        },
        queryStringParameters: {
          page: '123',
        },
        foo: 'bar',
      });
    });
  });

  describe('makeResponseW', () => {
    const TEST_RESPONSE_W_1 = {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{ "wham": "bam!" }',
    };

    it('should work with empty response and without extra properties', () => {
      expect(unit.makeResponseW(TEST_RESPONSE_W_1)).toStrictEqual({
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ "wham": "bam!" }',
      });
    });

    it('should work without extra properties', () => {
      expect(unit.makeResponseW(EMPTY_RESPONSE_W)).toStrictEqual({
        statusCode: 200,
        headers: {},
      });
    });

    it('should work with empty response and extra properties', () => {
      expect(unit.makeResponseW(EMPTY_RESPONSE_W, { foo: 'bar' })).toStrictEqual({
        statusCode: 200,
        headers: {},
        foo: 'bar',
      });
    });

    it('should work with extra properties', () => {
      expect(unit.makeResponseW(TEST_RESPONSE_W_1, { foo: 'bar' })).toStrictEqual({
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ "wham": "bam!" }',
        foo: 'bar',
      });
    });

    it('should work with extra properties which override base properties', () => {
      expect(
        unit.makeResponseW(TEST_RESPONSE_W_1, { foo: 'bar', headers: { 'content-type': 'text/xml' } })
      ).toStrictEqual({
        statusCode: 201,
        headers: {
          'content-type': 'text/xml',
        },
        body: '{ "wham": "bam!" }',
        foo: 'bar',
      });
    });
  });
});
