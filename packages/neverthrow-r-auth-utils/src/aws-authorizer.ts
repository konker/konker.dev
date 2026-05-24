import { fromResult, type ResultR } from '@konker.dev/neverthrow-r';
import type { APIGatewayAuthorizerResult } from 'aws-lambda';
import { err, ok } from 'neverthrow';

export function transformLambdaAuthorizerArn(arn: string): ResultR<unknown, string, Error> {
  const arnRe = /^(arn:aws:execute-api:[\w-]+:\d{12}:\w+\/[$\w]+\/)([\S/]+)+$/;
  if (!arnRe.test(arn)) {
    return fromResult(err(new Error('Invalid arn')));
  }

  return fromResult(ok(arn.replace(arnRe, '$1*')));
}

export const generateLambdaAuthResult =
  (effect: 'Allow' | 'Deny') =>
  (principalId: string, lambdaArn: string): APIGatewayAuthorizerResult => ({
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: lambdaArn,
        },
      ],
    },
    context: {
      principalId,
    },
  });

export const generateLambdaAuthResultAllow: (principalId: string, lambdaArn: string) => APIGatewayAuthorizerResult =
  generateLambdaAuthResult('Allow');

export const generateLambdaAuthResultDeny: (principalId: string, lambdaArn: string) => APIGatewayAuthorizerResult =
  generateLambdaAuthResult('Deny');
