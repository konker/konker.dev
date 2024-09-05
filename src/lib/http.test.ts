/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './http';

describe('lib/http', () => {
  describe('UNKNOWN_STRING_EFFECT', () => {
    it('should work as expected', () => {
      expect(P.Effect.runSync(unit.UNKNOWN_STRING_EFFECT())).toStrictEqual('UNKNOWN');
    });
  });

  describe('ResponseHeaders', () => {
    it('should work as expected', () => {
      expect(P.pipe({ 'content-type': 'text/plain' }, P.Schema.decode(unit.ResponseHeaders))).toStrictEqual(
        P.Either.right({
          'content-type': 'text/plain',
        })
      );
    });
  });

  describe('OptionalResponseHeaders', () => {
    it('should work as expected', () => {
      expect(P.pipe({ 'content-type': 'text/plain' }, P.Schema.decode(unit.OptionalResponseHeaders))).toStrictEqual(
        P.Either.right({
          'content-type': 'text/plain',
        })
      );
      expect(P.pipe(undefined, P.Schema.decode(unit.OptionalResponseHeaders))).toStrictEqual(P.Either.right(undefined));
    });
  });

  describe('BaseResponse', () => {
    it('should work as expected', () => {
      expect(
        P.pipe(
          { statusCode: 200, headers: { 'content-type': 'text/plain' }, isBase64Encoded: false, body: 'abc' },
          P.Schema.decode(unit.BaseResponse)
        )
      ).toStrictEqual(
        P.Either.right({
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
      expect(P.pipe({ isAuthorized: false }, P.Schema.decode(unit.BaseSimpleAuthResponse))).toStrictEqual(
        P.Either.right({ isAuthorized: false })
      );
    });
  });

  describe('BaseSimpleAuthResponseWithContext', () => {
    const TEST_CONTEXT = P.Schema.Struct({ userId: P.Schema.String });

    it('should work as expected', () => {
      expect(
        P.pipe(
          { isAuthorized: false, context: { userId: 'abc' } },
          P.Schema.decode(unit.BaseSimpleAuthResponseWithContext(TEST_CONTEXT))
        )
      ).toStrictEqual(P.Either.right({ isAuthorized: false, context: { userId: 'abc' } }));
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
