import * as P from '@konker.dev/effect-ts-prelude';
import type { APIGatewayAuthorizerResult } from 'aws-lambda';

export function transformLambdaAuthorizerArn(arn: string): P.Effect.Effect<string, Error> {
  const ARN_RE = /^(arn:aws:execute-api:[\w-]+:\d{12}:\w+\/[\$\w]+\/)([\S/]+)+$/;
  if (!ARN_RE.test(arn)) return P.Effect.fail(new Error('Invalid arn'));

  // Return a version of arn that permits all the resources with all methods
  return P.Effect.succeed(arn.replace(ARN_RE, '$1*'));
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
