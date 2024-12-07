import type { PublishCommandInput } from '@aws-sdk/client-sns';
import * as P from '@konker.dev/effect-ts-prelude';
import { describe, expect, it } from 'vitest';

import * as unit from './error';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const params: PublishCommandInput = { TopicArn: 't1', Message: '' };
    const actual = P.pipe(error, unit.toSnsError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SnsError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const params: PublishCommandInput = { TopicArn: 't1', Message: '' };
    const actual = P.pipe(error, unit.toSnsError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SnsError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });
});
