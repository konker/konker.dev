import * as unit from './error';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const actual = unit.toMomentoClientError(error);

    expect(actual.toObject()).toStrictEqual({
      _tag: unit.ERROR_TAG,
      name: 'Error',
      message: 'BOOM!',
      statusCode: -1,
      codeTag: 'GENERAL',
      cause: error,
      internal: true,
      stack: expect.stringContaining('Error'),
    });
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const actual = unit.toMomentoClientError(error);

    expect(actual.toObject()).toStrictEqual({
      _tag: unit.ERROR_TAG,
      name: 'MomentoClientError',
      message: 'BOOM!',
      statusCode: -1,
      codeTag: 'GENERAL',
      cause: error,
      internal: true,
      stack: expect.stringContaining('Error'),
    });
  });
});
