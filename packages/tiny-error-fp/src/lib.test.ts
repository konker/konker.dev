import { TinyError } from './index';
import * as unit from './lib';

describe('lib', () => {
  describe('hasTag', () => {
    it('should work as expected', () => {
      expect(unit.hasTag('MyTag')({ _tag: 'MyTag' })).toBe(true);
      expect(unit.hasTag('MyTag')({ foo: 'abc' })).toBe(false);
      expect(unit.hasTag('MyTag')('banana')).toBe(false);
      expect(unit.hasTag('MyTag')(null)).toBe(false);
    });
  });

  describe('hasErrorName', () => {
    it('should work as expected with an object', () => {
      expect(unit.hasErrorName({ name: 'Boom!' })).toEqual(true);
      expect(unit.hasErrorName({ title: 'Boom!' })).toEqual(false);
      expect(unit.hasErrorName(null)).toEqual(false);
    });

    it('should work as expected with an Error instance', () => {
      expect(unit.hasErrorName(new Error('Boom!'))).toEqual(true);
    });
  });

  describe('hasErrorMessage', () => {
    it('should work as expected with an object', () => {
      expect(unit.hasErrorMessage({ message: 'Boom!' })).toEqual(true);
      expect(unit.hasErrorMessage({ baggage: 'Boom!' })).toEqual(false);
      expect(unit.hasErrorMessage(null)).toEqual(false);
    });

    it('should work as expected with an Error instance', () => {
      expect(unit.hasErrorMessage(new Error('Boom!'))).toEqual(true);
    });
  });

  describe('hasErrorStack', () => {
    it('should work as expected with an object', () => {
      expect(unit.hasErrorStack({ stack: 'Boom!' })).toEqual(true);
      expect(unit.hasErrorStack({ pile: 'Boom!' })).toEqual(false);
      expect(unit.hasErrorStack(null)).toEqual(false);
    });

    it('should work as expected with an Error instance', () => {
      expect(unit.hasErrorStack(new Error('Boom!'))).toEqual(true);
    });
  });

  describe('isError', () => {
    it('should work as expected with an object', () => {
      expect(unit.isError(TinyError('MyTag')())).toEqual(true);
      expect(unit.isError({ message: 'Boom!' })).toEqual(false);
      expect(unit.isError(null)).toEqual(false);
    });

    it('should work as expected with an Error instance', () => {
      expect(unit.isError(new Error('Boom!'))).toEqual(true);
    });
  });

  describe('toError', () => {
    it('should function as expected', () => {
      const someError = new Error('SOME_ERROR');

      expect(unit.toError('BANANA')).toStrictEqual(new Error('BANANA'));
      expect(unit.toError({ foo: 'BAR' })).toStrictEqual(new Error('[object Object]'));
      expect(unit.toError(someError)).toStrictEqual(someError);
    });
  });

  describe('getStackString', () => {
    it('should function as expected', () => {
      const actual = unit.getStackTraceString();
      expect(actual).toBeDefined();
      expect(typeof actual).toEqual('string');
    });
  });
});
