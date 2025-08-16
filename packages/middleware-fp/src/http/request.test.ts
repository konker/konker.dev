import { describe, expect, it } from 'vitest';

import { EMPTY_REQUEST_W } from './request.js';
import * as unit from './request.js';

describe('http/request', () => {
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
});
