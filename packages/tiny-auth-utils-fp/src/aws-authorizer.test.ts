import * as P from '@konker.dev/effect-ts-prelude';
import type { APIGatewayAuthorizerResult } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import * as unit from './aws-authorizer';

const TEST_ALLOW_RESPONSE: APIGatewayAuthorizerResult = {
  principalId: 'principalId',
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: 'lambdaArn',
      },
    ],
  },
  context: {
    principalId: 'principalId',
  },
};

const TEST_DENY_RESPONSE: APIGatewayAuthorizerResult = {
  principalId: 'principalId',
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: 'Deny',
        Resource: 'lambdaArn',
      },
    ],
  },
  context: {
    principalId: 'principalId',
  },
};

describe('aws-authorizer', () => {
  describe('transformLambdaAuthorizerArn', () => {
    it('should generate a response with the correct effect', () => {
      const actual = unit.transformLambdaAuthorizerArn(
        'arn:aws:execute-api:eu-north-1:898403669204:caidu80ct6/$default/GET/users/a0000000-a000-4000-a000-a00000000000/widgets'
      );
      expect(P.Effect.runSync(actual)).toEqual('arn:aws:execute-api:eu-north-1:898403669204:caidu80ct6/$default/*');
    });

    it('should behave as expected with bad input', () => {
      const actual = unit.transformLambdaAuthorizerArn(
        'FOO:aws:execute-api:eu-west-1:111111111111:h656j4cxjf/test/GET/'
      );
      expect(() => P.Effect.runSync(actual)).toThrow('Invalid arn');
    });
  });

  describe('generateLambdaAuthResult', () => {
    it('should generate a valid response', () => {
      const actual = unit.generateLambdaAuthResult('Allow')('principalId', 'lambdaArn');
      expect(actual).toStrictEqual(TEST_ALLOW_RESPONSE);
    });
  });

  describe('generateLambdaAuthResultAllow', () => {
    it('should generate a valid response', () => {
      const actual = unit.generateLambdaAuthResultAllow('principalId', 'lambdaArn');
      expect(actual).toStrictEqual(TEST_ALLOW_RESPONSE);
    });
  });

  describe('generateLambdaAuthResultDeny', () => {
    it('should generate a valid response', () => {
      const actual = unit.generateLambdaAuthResultDeny('principalId', 'lambdaArn');
      expect(actual).toStrictEqual(TEST_DENY_RESPONSE);
    });
  });
});
