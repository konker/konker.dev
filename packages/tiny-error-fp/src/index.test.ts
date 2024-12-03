import * as unit from './index';

describe('TinyError', () => {
  describe('TinyError', () => {
    it('should work as expected with default params', () => {
      expect(unit.TinyError('TEST_TAG')().toObject()).toEqual({
        _tag: 'TEST_TAG',
        name: 'TEST_TAG',
        message: 'TEST_TAG',
        statusCode: -1,
        codeTag: 'GENERAL',
        cause: 'UNKNOWN',
        internal: true,
        stack: expect.stringContaining('Error'),
      });
    });

    it('should work as expected with status code', () => {
      expect(unit.TinyError('TEST_TAG', 500)().toObject()).toEqual({
        _tag: 'TEST_TAG',
        name: 'TEST_TAG',
        message: 'TEST_TAG',
        statusCode: 500,
        codeTag: 'GENERAL',
        cause: 'UNKNOWN',
        internal: true,
        stack: expect.stringContaining('Error'),
      });
    });
  });

  describe('isTinyError', () => {
    const ctor = unit.TinyError('TEST_TAG', 123);

    it('should work as expected with a matching TinyError instance input', () => {
      expect(unit.isTinyError('TEST_TAG')(unit.toTinyError('TEST_TAG', ctor)('Boom!'))).toEqual(true);
    });

    it('should work as expected with a non-matching TinyError instance input', () => {
      expect(unit.isTinyError('OTHER_TAG')(unit.toTinyError('TEST_TAG', ctor)('Boom!'))).toEqual(false);
    });

    it('should work as expected with an Error instance input', () => {
      expect(unit.isTinyError('TEST_TAG')(new Error('Boom!'))).toEqual(false);
    });

    it('should work as expected with some other input', () => {
      expect(unit.isTinyError('TEST_TAG')('Boom!')).toEqual(false);
    });
  });

  describe('toTinyError', () => {
    const ctor = unit.TinyError('MyTag', 123);

    it('should work as expected with an TinyError instance input', () => {
      const error = unit.TinyError('MyTag')('BOOM!');
      const actual = unit.toTinyError('MyTag', ctor)(error);
      expect(actual.toObject()).toStrictEqual(error.toObject());
    });

    it('should work as expected with a Error instance input', () => {
      const error = new Error('BOOM!');
      const actual = unit.toTinyError('MyTag', ctor)(error);
      expect(actual.toObject()).toStrictEqual({
        _tag: 'MyTag',
        cause: error,
        codeTag: 'GENERAL',
        internal: true,
        message: 'BOOM!',
        name: 'Error',
        statusCode: 123,
        stack: expect.stringContaining('Error: '),
      });
    });

    it('should work as expected with a non-Error input with message', () => {
      const error = { message: 'BOOM!' };
      const actual = unit.toTinyError('MyTag', ctor)(error);
      expect(actual.toObject()).toStrictEqual({
        _tag: 'MyTag',
        cause: {
          message: 'BOOM!',
        },
        codeTag: 'GENERAL',
        internal: true,
        message: 'BOOM!',
        name: 'MyTag',
        statusCode: 123,
        stack: expect.stringContaining('Error'),
      });
    });

    it('should work as expected with a non-Error input without message', () => {
      const error = { baggage: 'BOOM!' };
      const actual = unit.toTinyError('MyTag', ctor)(error);
      expect(actual.toObject()).toStrictEqual({
        _tag: 'MyTag',
        cause: {
          baggage: 'BOOM!',
        },
        codeTag: 'GENERAL',
        internal: true,
        message: '{"baggage":"BOOM!"}',
        name: 'MyTag',
        statusCode: 123,
        stack: expect.stringContaining('Error'),
      });
    });

    it('should work as expected with a string input', () => {
      const error = 'BOOM!';
      const actual = unit.toTinyError('MyTag', ctor)(error);
      expect(actual.toObject()).toStrictEqual({
        _tag: 'MyTag',
        cause: 'BOOM!',
        codeTag: 'GENERAL',
        internal: true,
        message: 'BOOM!',
        name: 'MyTag',
        statusCode: 123,
        stack: expect.stringContaining('Error'),
      });
    });
  });
});
