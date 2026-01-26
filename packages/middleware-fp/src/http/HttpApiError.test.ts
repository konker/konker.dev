import { Effect, pipe } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './HttpApiError.js';

describe('HttpApiError', () => {
  const s = 'STR_ERROR';
  const e = new Error(s);
  const hae: unit.HttpApiError = new unit.HttpApiError({
    statusCode: 123,
    message: 'HAE_MESSAGE',
    internal: ['HAE_STACK'],
  });
  const circ: Record<string, unknown> = {};
  circ.x = circ;

  describe('toHttpApiError', () => {
    it('should function as expected when passed just an HttpApiError', () => {
      const actual = unit.toHttpApiError(hae);
      expect(actual).toBeInstanceOf(unit.HttpApiError);
      expect(actual).toMatchObject({
        statusCode: 123,
        message: 'HAE_MESSAGE',
        internal: [hae, 'HAE_STACK'],
      });
    });

    it('should function as expected when passed an HttpApiError, an override statusCode, and message', () => {
      const actual = unit.toHttpApiError(hae, 456, 'MESSAGE_OVERRIDE');
      expect(actual).toBeInstanceOf(unit.HttpApiError);
      expect(actual).toMatchObject({
        statusCode: 456,
        message: 'MESSAGE_OVERRIDE',
        internal: [hae, 'HAE_STACK'],
      });
    });

    it('should function as expected when passed an Error', () => {
      const actual = unit.toHttpApiError(e);
      expect(actual).toBeInstanceOf(unit.HttpApiError);
      expect(actual).toMatchObject({
        _tag: 'HttpApiError',
        statusCode: 500,
        message: 'Internal Server Error',
        internal: [e],
      });
    });

    it('should function as expected when passed an Error and other params', () => {
      const actual = unit.toHttpApiError(e, 400, 'SOME_MESSAGE');
      expect(actual).toBeInstanceOf(unit.HttpApiError);
      expect(actual).toMatchObject({
        _tag: 'HttpApiError',
        statusCode: 400,
        message: 'SOME_MESSAGE',
        internal: [e],
      });
    });

    it('should function as expected when passed a string', () => {
      const actual = unit.toHttpApiError('ROOT_CAUSE');
      expect(actual).toBeInstanceOf(unit.HttpApiError);
      expect(actual).toMatchObject({
        _tag: 'HttpApiError',
        statusCode: 500,
        message: 'Internal Server Error',
        internal: ['ROOT_CAUSE'],
      });
    });

    it('should function as expected when passed a string and other params', () => {
      const actual = unit.toHttpApiError('ROOT_CAUSE', 400, 'SOME_MESSAGE');
      expect(actual).toBeInstanceOf(unit.HttpApiError);
      expect(actual).toMatchObject({
        _tag: 'HttpApiError',
        statusCode: 400,
        message: 'SOME_MESSAGE',
        internal: ['ROOT_CAUSE'],
      });
    });
  });

  describe('toErrorResponseW', () => {
    it('should function as expected', async () => {
      const actual = await pipe(unit.toErrorResponseW(hae), Effect.runPromise);
      expect(actual).toStrictEqual({
        statusCode: 123,
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"message":"HAE_MESSAGE","statusCode":123}',
      });
    });
  });
});
