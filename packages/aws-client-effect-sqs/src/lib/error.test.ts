import type { SendMessageCommandInput } from '@aws-sdk/client-sqs';
import * as P from '@konker.dev/effect-ts-prelude';
import { describe, expect, it } from 'vitest';

import * as unit from './error';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const params: SendMessageCommandInput = { QueueUrl: 'q1', MessageBody: '' };
    const actual = P.pipe(error, unit.toSqsError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SqsError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const params: SendMessageCommandInput = { QueueUrl: 'q1', MessageBody: '' };
    const actual = P.pipe(error, unit.toSqsError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SqsError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });
});
