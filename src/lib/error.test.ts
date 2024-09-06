import * as P from '@konker.dev/effect-ts-prelude';

import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';

import * as unit from './error';

describe('error', () => {
  it('should work as expected with an Error instance input', () => {
    const error = new Error('BOOM!');
    const params: GetSecretValueCommandInput = { SecretId: 's1' };
    const actual = P.pipe(error, unit.toSecretsManagerError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SecretsManagerError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });

  it('should work as expected with a non-Error input', () => {
    const error = 'BOOM!';
    const params: GetSecretValueCommandInput = { SecretId: 's1' };
    const actual = P.pipe(error, unit.toSecretsManagerError(params));
    const expected = { message: 'BOOM!', cause: error, _tag: 'SecretsManagerError', _Params: params };
    expect(actual).toStrictEqual(expected);
  });
});
