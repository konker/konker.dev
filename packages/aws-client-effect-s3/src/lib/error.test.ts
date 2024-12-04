import type { GetObjectCommandInput } from '@aws-sdk/client-s3';
import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './error';
import { TAG } from './error';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM1!');
    const params: GetObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
    const actual = P.pipe(error, unit.toS3Error(params));
    const expected = { message: 'BOOM1!', cause: error, _tag: TAG, _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM2!';
    const params: GetObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
    const actual = P.pipe(error, unit.toS3Error(params));
    const expected = { message: 'BOOM2!', cause: error, _tag: TAG, _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = { _tag: TAG, code: 'BOOM3!' };
    const params: GetObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
    const actual = P.pipe(error, unit.toS3Error(params));
    const expected = { message: 'BOOM3!', cause: error, _tag: TAG, _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = { _tag: TAG, message: 'BOOM4!' };
    const params: GetObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
    const actual = P.pipe(error, unit.toS3Error(params));
    const expected = { message: 'BOOM4!', cause: error, _tag: TAG, _Params: params };
    expect(actual).toStrictEqual(expected);
  });
});
