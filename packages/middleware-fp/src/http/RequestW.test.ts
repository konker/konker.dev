import { describe, expect, it } from 'vitest';

import { EMPTY_REQUEST_W } from './RequestW.js';
import * as unit from './RequestW.js';

describe('http/request', () => {
  describe('makeRequestW', () => {
    const TEST_REQUEST_W_1 = {
      url: '/',
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
        url: '/',
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
        url: '/',
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        foo: 'bar',
      });
    });

    it('should work with request and with extra properties', () => {
      expect(unit.makeRequestW(TEST_REQUEST_W_1, { foo: 'bar' })).toStrictEqual({
        url: '/',
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
        url: '/',
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
