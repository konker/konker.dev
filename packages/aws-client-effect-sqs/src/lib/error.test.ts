import type { SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { pipe } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './error';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const params: SendMessageCommandInput = { QueueUrl: 'q1', MessageBody: '' };
    const actual = pipe(error, unit.toSqsError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SqsError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const params: SendMessageCommandInput = { QueueUrl: 'q1', MessageBody: '' };
    const actual = pipe(error, unit.toSqsError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SqsError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });
});
