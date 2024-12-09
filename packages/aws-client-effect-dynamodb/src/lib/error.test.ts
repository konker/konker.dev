import type { GetCommandInput } from '@aws-sdk/lib-dynamodb';
import { pipe } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './error';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const params: GetCommandInput = { TableName: 't1', Key: {} };
    const actual = pipe(error, unit.toDynamoDbError(params));
    const expected = { name: 'BOOM!', message: 'BOOM!', cause: error, _tag: 'DynamoDbError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const params: GetCommandInput = { TableName: 't1', Key: {} };
    const actual = pipe(error, unit.toDynamoDbError(params));
    const expected = { name: 'DynamoDbError', message: 'BOOM!', cause: error, _tag: 'DynamoDbError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });
});
