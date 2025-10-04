import { describe, expect, it } from 'vitest';

import * as unit from './ResponseW.js';
import { EMPTY_RESPONSE_W } from './ResponseW.js';

describe('http/response', () => {
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
