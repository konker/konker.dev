import * as P from '@konker.dev/effect-ts-prelude';

import type { GetParameterCommandInput } from '@aws-sdk/client-ssm';

import * as unit from './error';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const params: GetParameterCommandInput = { Name: 'p1' };
    const actual = P.pipe(error, unit.toSsmError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SsmError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const params: GetParameterCommandInput = { Name: 'p1' };
    const actual = P.pipe(error, unit.toSsmError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SsmError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });
});
