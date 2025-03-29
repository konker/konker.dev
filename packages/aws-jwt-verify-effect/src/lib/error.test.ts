import { describe, expect, it } from 'vitest';

import * as unit from './error.js';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const actual = unit.toJwtVerifyError(error);
    const expected = { message: 'BOOM!', cause: error, _tag: 'JwtVerifyError' };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const actual = unit.toJwtVerifyError(error);
    const expected = { message: 'BOOM!', cause: error, _tag: 'JwtVerifyError' };
    expect(actual).toStrictEqual(expected);
  });
});
