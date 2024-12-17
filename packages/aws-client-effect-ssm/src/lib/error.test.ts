import type { GetParameterCommandInput } from '@aws-sdk/client-ssm';
import { pipe } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './error.js';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const params: GetParameterCommandInput = { Name: 'p1' };
    const actual = pipe(error, unit.toSsmError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SsmError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const params: GetParameterCommandInput = { Name: 'p1' };
    const actual = pipe(error, unit.toSsmError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SsmError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });
});
