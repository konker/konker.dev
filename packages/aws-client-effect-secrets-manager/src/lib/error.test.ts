import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';
import { pipe } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './error';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const params: GetSecretValueCommandInput = { SecretId: 's1' };
    const actual = pipe(error, unit.toSecretsManagerError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SecretsManagerError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const params: GetSecretValueCommandInput = { SecretId: 's1' };
    const actual = pipe(error, unit.toSecretsManagerError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SecretsManagerError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });
});
