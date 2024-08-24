/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './http';

describe('aws-api-gateway-processor/lib', () => {
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
