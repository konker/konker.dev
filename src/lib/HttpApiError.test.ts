import * as unit from './HttpApiError';

describe('error/ApiError', () => {
  const s = 'STR_ERROR';
  const e = new Error(s);
  const ae: unit.HttpApiError = unit.HttpApiError('AE_NAME', 'AE_MESSAGE', 123, 'AE_CODE_TAG', e, false, 'AE_STACK');
  const aei: unit.HttpApiError = unit.HttpApiError('AE_NAME', 'AE_MESSAGE', 123, 'AE_CODE_TAG', e, true, 'AE_STACK');
  const circ: Record<string, unknown> = {};
  circ['x'] = circ;

  describe('HttpApiError', () => {
    it('should default as expected', () => {
      expect(unit.HttpApiError().toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'HttpApiError',
        message: 'HttpApiError',
        statusCode: 500,
        cause: 'UNKNOWN',
        codeTag: 'GENERAL',
        internal: true,
        stack: expect.stringContaining('Error'),
      });
    });
  });

  describe('toApiError', () => {
    it('should function as expected when passed an ApiError', () => {
      expect(unit.toHttpApiError(ae)).toStrictEqual(ae);
      expect(unit.toHttpApiError(aei)).toStrictEqual(ae);
    });

    it('should function as expected when passed an Error', () => {
      expect(unit.toHttpApiError(e, 'SOME_NAME', 'SOME_MESSAGE', 400).toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'SOME_NAME',
        message: 'SOME_MESSAGE',
        statusCode: 400,
        codeTag: 'GENERAL',
        internal: true,
        cause: e,
        stack: expect.stringContaining('Error'),
      });
      expect(unit.toHttpApiError(e, 'SOME_NAME', 'SOME_MESSAGE').toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'SOME_NAME',
        message: 'SOME_MESSAGE',
        statusCode: 500,
        codeTag: 'GENERAL',
        internal: true,
        cause: e,
        stack: expect.stringContaining('Error'),
      });
      expect(unit.toHttpApiError(e, 'SOME_NAME').toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'SOME_NAME',
        message: e.message,
        statusCode: 500,
        codeTag: 'GENERAL',
        internal: true,
        cause: e,
        stack: expect.stringContaining('Error'),
      });
      expect(unit.toHttpApiError(e).toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: e.name,
        message: e.message,
        statusCode: 500,
        codeTag: 'GENERAL',
        internal: true,
        cause: e,
        stack: expect.stringContaining('Error'),
      });
    });

    it('should function as expected when passed an string', () => {
      expect(unit.toHttpApiError(s).toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'HttpApiError',
        message: s,
        statusCode: 500,
        codeTag: 'GENERAL',
        internal: true,
        cause: 'STR_ERROR',
        stack: expect.stringContaining('Error'),
      });
      expect(unit.toHttpApiError(s, 'SOME_NAME', 'SOME_MESSAGE').toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'SOME_NAME',
        message: 'SOME_MESSAGE',
        statusCode: 500,
        codeTag: 'GENERAL',
        internal: true,
        cause: 'STR_ERROR',
        stack: expect.stringContaining('Error'),
      });
      expect(unit.toHttpApiError(s, undefined, undefined, undefined).toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'HttpApiError',
        message: s,
        statusCode: 500,
        codeTag: 'GENERAL',
        internal: true,
        cause: 'STR_ERROR',
        stack: expect.stringContaining('Error'),
      });
    });

    it('should function as expected when passed other', () => {
      expect(unit.toHttpApiError({ foo: 'BAR', message: s }).toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'HttpApiError',
        message: s,
        statusCode: 500,
        codeTag: 'GENERAL',
        internal: true,
        cause: {
          foo: 'BAR',
          message: 'STR_ERROR',
        },
        stack: expect.stringContaining('Error'),
      });
      expect(unit.toHttpApiError({ foo: 'BAR!!!' }).toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'HttpApiError',
        message: '{"foo":"BAR!!!"}',
        statusCode: 500,
        codeTag: 'GENERAL',
        internal: true,
        cause: {
          foo: 'BAR!!!',
        },
        stack: expect.stringContaining('Error'),
      });
      expect(unit.toHttpApiError({ foo: 'BAR!!!', circ }).toObject()).toStrictEqual({
        _tag: 'HttpApiError',
        name: 'HttpApiError',
        message: 'UNKNOWN',
        statusCode: 500,
        codeTag: 'GENERAL',
        internal: true,
        cause: {
          circ,
          foo: 'BAR!!!',
        },

        stack: expect.stringContaining('Error'),
      });
    });
  });
});
