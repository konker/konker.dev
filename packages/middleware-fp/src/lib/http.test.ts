import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import * as Either from 'effect/Either';
import { describe, expect, it } from 'vitest';

import * as unit from './http';

describe('lib/http', () => {
  describe('UNKNOWN_STRING_EFFECT', () => {
    it('should work as expected', () => {
      expect(Effect.runSync(unit.UNKNOWN_STRING_EFFECT())).toStrictEqual('UNKNOWN');
    });
  });

  describe('ResponseHeaders', () => {
    it('should work as expected', () => {
      expect(pipe({ 'content-type': 'text/plain' }, Schema.decode(unit.ResponseHeaders))).toStrictEqual(
        Either.right({
          'content-type': 'text/plain',
        })
      );
    });
  });

  describe('OptionalResponseHeaders', () => {
    it('should work as expected', () => {
      expect(pipe({ 'content-type': 'text/plain' }, Schema.decode(unit.OptionalResponseHeaders))).toStrictEqual(
        Either.right({
          'content-type': 'text/plain',
        })
      );
      expect(pipe(undefined, Schema.decode(unit.OptionalResponseHeaders))).toStrictEqual(Either.right(undefined));
    });
  });

  describe('BaseResponse', () => {
    it('should work as expected', () => {
      expect(
        pipe(
          { statusCode: 200, headers: { 'content-type': 'text/plain' }, isBase64Encoded: false, body: 'abc' },
          Schema.decode(unit.BaseResponse)
        )
      ).toStrictEqual(
        Either.right({
          statusCode: 200,
          headers: { 'content-type': 'text/plain' },
          isBase64Encoded: false,
          body: 'abc',
        })
      );
    });
  });

  describe('BaseSimpleAuthResponse', () => {
    it('should work as expected', () => {
      expect(pipe({ isAuthorized: false }, Schema.decode(unit.BaseSimpleAuthResponse))).toStrictEqual(
        Either.right({ isAuthorized: false })
      );
    });
  });

  describe('BaseSimpleAuthResponseWithContext', () => {
    const TEST_CONTEXT = Schema.Struct({ userId: Schema.String });

    it('should work as expected', () => {
      expect(
        pipe(
          { isAuthorized: false, context: { userId: 'abc' } },
          Schema.decode(unit.BaseSimpleAuthResponseWithContext(TEST_CONTEXT))
        )
      ).toStrictEqual(Either.right({ isAuthorized: false, context: { userId: 'abc' } }));
    });
  });

  describe('DEFAULT_500_RESPONSE', () => {
    it('should work as expected', () => {
      expect(unit.DEFAULT_500_RESPONSE()).toStrictEqual({
        statusCode: 500,
        body: '"InternalServerError"',
      });
    });
  });

  describe('CHAOS', () => {
    it('should work as expected', () => {
      expect(() => unit.CHAOS('Tag')).toThrow('BOOM');
    });
  });
});
