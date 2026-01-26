import { describe, expect, it } from 'vitest';

import * as unit from './MiddlewareError.js';

describe('MiddlewareError', () => {
  describe('toMiddlewareError', () => {
    it('should work as expected with a MiddlewareError instance input', () => {
      const error = new unit.MiddlewareError({ message: 'BOOM!' });
      const actual = unit.toMiddlewareError(error);
      expect(actual).toBeInstanceOf(unit.MiddlewareError);
      expect(actual).toMatchObject({
        _tag: unit.ERROR_TAG,
        message: 'BOOM!',
        internal: [error],
      });
    });

    it('should work as expected with an Error instance input', () => {
      const error = new Error('BOOM!');
      const actual = unit.toMiddlewareError(error);
      expect(actual).toBeInstanceOf(unit.MiddlewareError);
      expect(actual).toMatchObject({
        _tag: unit.ERROR_TAG,
        message: 'BOOM!',
        internal: [error],
      });
    });

    it('should work as expected with an Error instance input, and message param', () => {
      const error = new Error('BOOM!');
      const actual = unit.toMiddlewareError(error, 'OVERRIDE_MESSAGE');
      expect(actual).toBeInstanceOf(unit.MiddlewareError);
      expect(actual).toMatchObject({
        _tag: unit.ERROR_TAG,
        message: 'OVERRIDE_MESSAGE',
        internal: [error],
      });
    });

    it('should work as expected with a string input', () => {
      const errorStr = 'BOOM!';
      const actual = unit.toMiddlewareError(errorStr);
      expect(actual).toBeInstanceOf(unit.MiddlewareError);
      expect(actual).toMatchObject({
        _tag: unit.ERROR_TAG,
        message: 'BOOM!',
        internal: [errorStr],
      });
    });

    it('should work as expected with a string input, and message param', () => {
      const errorStr = 'BOOM!';
      const actual = unit.toMiddlewareError(errorStr, 'OVERRIDE_MESSAGE');
      expect(actual).toBeInstanceOf(unit.MiddlewareError);
      expect(actual).toMatchObject({
        _tag: unit.ERROR_TAG,
        message: 'OVERRIDE_MESSAGE',
        internal: [errorStr],
      });
    });

    it('should work as expected with other input', () => {
      const errorObj = { foo: 'BOOM!' };
      const actual = unit.toMiddlewareError(errorObj);
      expect(actual).toBeInstanceOf(unit.MiddlewareError);
      expect(actual).toMatchObject({
        _tag: unit.ERROR_TAG,
        message: 'Internal Server Error',
        internal: [errorObj],
      });
    });

    it('should work as expected with other input, and message param', () => {
      const errorObj = { foo: 'BOOM!' };
      const actual = unit.toMiddlewareError(errorObj, 'OVERRIDE_MESSAGE');
      expect(actual).toBeInstanceOf(unit.MiddlewareError);
      expect(actual).toMatchObject({
        _tag: unit.ERROR_TAG,
        message: 'OVERRIDE_MESSAGE',
        internal: [errorObj],
      });
    });
  });
});
