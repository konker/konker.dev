import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { CognitoJwtVerifierMultiUserPool } from 'aws-jwt-verify/cognito-verifier';
import { type CognitoJwtVerifierMultiProperties, type CognitoVerifyProperties } from 'aws-jwt-verify/cognito-verifier';
import {
  type CognitoJwtVerifierProperties,
  type CognitoJwtVerifierSingleUserPool,
} from 'aws-jwt-verify/cognito-verifier';
import type { JwksCache } from 'aws-jwt-verify/jwk';
import type { CognitoIdOrAccessTokenPayload } from 'aws-jwt-verify/jwt-model';
import { type JwtVerifierProperties } from 'aws-jwt-verify/jwt-verifier';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { JwtVerifyError } from './lib/error.js';
import { toJwtVerifyError } from './lib/error.js';

// --------------------------------------------------------------------------
export type AwsCognitoJwtVerifierFactory = <T extends CognitoJwtVerifierProperties>(
  verifyProperties: T & Partial<CognitoJwtVerifierProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) => CognitoJwtVerifierSingleUserPool<T>;

export const defaultAwsCognitoJwtVerifierFactory: AwsCognitoJwtVerifierFactory = <
  T extends CognitoJwtVerifierProperties,
>(
  verifyProperties: T & Partial<CognitoJwtVerifierProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) => CognitoJwtVerifier.create(verifyProperties, additionalProperties);

// --------------------------------------------------------------------------
export const defaultAwsCognitoJwtVerifierMultiFactory: AwsCognitoJwtVerifierFactoryVerifierMultiFactory = <
  T extends CognitoJwtVerifierMultiProperties,
>(
  verifyProperties: T & Partial<CognitoJwtVerifierMultiProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) => CognitoJwtVerifier.create(verifyProperties, additionalProperties);

export type AwsCognitoJwtVerifierFactoryVerifierMultiFactory = <T extends CognitoJwtVerifierMultiProperties>(
  verifyProperties: T & Partial<CognitoJwtVerifierMultiProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) => CognitoJwtVerifierMultiUserPool<T>;

// --------------------------------------------------------------------------
export type AwsCognitoJwtVerifierFactoryDeps = {
  readonly awsCognitoJwtVerifierFactory:
    | AwsCognitoJwtVerifierFactory
    | AwsCognitoJwtVerifierFactoryVerifierMultiFactory;
};
export const AwsCognitoJwtVerifierFactoryDeps = Context.GenericTag<AwsCognitoJwtVerifierFactoryDeps>(
  '@aws-cognito-jwt-verify-effect/AwsJwtVerifierFactoryDeps'
);

export const defaultAwsCognitoJwtVerifierFactoryDeps = Effect.provideService(
  AwsCognitoJwtVerifierFactoryDeps,
  AwsCognitoJwtVerifierFactoryDeps.of({
    awsCognitoJwtVerifierFactory: defaultAwsCognitoJwtVerifierFactory,
  })
);

// --------------------------------------------------------------------------
export type AwsCognitoJwtVerifierDeps<
  SpecificVerifyProperties extends Partial<CognitoVerifyProperties> | Partial<CognitoJwtVerifierMultiProperties>,
  IssuerConfig extends JwtVerifierProperties<SpecificVerifyProperties> & {
    userPoolId: string;
    audience: null;
  },
  MultiIssuer extends boolean,
> = {
  readonly awsJwtVerifier: CognitoJwtVerifier<SpecificVerifyProperties, IssuerConfig, MultiIssuer>;
};
export const AwsCognitoJwtVerifierDeps = <
  SpecificVerifyProperties extends Partial<CognitoVerifyProperties> | Partial<CognitoJwtVerifierMultiProperties>,
  IssuerConfig extends JwtVerifierProperties<SpecificVerifyProperties> & {
    userPoolId: string;
    audience: null;
  },
  MultiIssuer extends boolean,
>() =>
  Context.GenericTag<AwsCognitoJwtVerifierDeps<SpecificVerifyProperties, IssuerConfig, MultiIssuer>>(
    'aws-cognito-jwt-verify-effect/AwsJwtVerifierDeps'
  );

export const defaultCognitoAwsJwtVerifierDeps = <
  T extends CognitoJwtVerifierProperties | CognitoJwtVerifierMultiProperties,
>(
  verifyProperties: T & Partial<CognitoJwtVerifierProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) =>
  Effect.provideService(
    AwsCognitoJwtVerifierDeps(),
    AwsCognitoJwtVerifierDeps().of({
      awsJwtVerifier: defaultAwsCognitoJwtVerifierFactory(verifyProperties, additionalProperties),
    })
  );

// --------------------------------------------------------------------------
type CognitoVerifyParameters<SpecificVerifyProperties> =
  Record<string, never> extends SpecificVerifyProperties
    ? [jwt: string, props?: SpecificVerifyProperties]
    : [jwt: string, props: SpecificVerifyProperties];

export const awsCognitoJwtVerifierVerify = <
  SpecificVerifyProperties extends Partial<CognitoVerifyProperties> | Partial<CognitoJwtVerifierMultiProperties>,
  IssuerConfig extends JwtVerifierProperties<SpecificVerifyProperties> & {
    userPoolId: string;
    audience: null;
  },
  MultiIssuer extends boolean,
>(
  // eslint-disable-next-line fp/no-rest-parameters
  ...params: CognitoVerifyParameters<SpecificVerifyProperties>
): Effect.Effect<
  CognitoIdOrAccessTokenPayload<IssuerConfig, SpecificVerifyProperties>,
  JwtVerifyError,
  AwsCognitoJwtVerifierDeps<SpecificVerifyProperties, IssuerConfig, MultiIssuer>
> => {
  return pipe(
    AwsCognitoJwtVerifierDeps<SpecificVerifyProperties, IssuerConfig, MultiIssuer>(),
    Effect.flatMap((deps) =>
      Effect.tryPromise({ try: () => deps.awsJwtVerifier.verify(...params), catch: toJwtVerifyError })
    )
  );
};

// --------------------------------------------------------------------------
export function awsCognitoParseUserPoolId(userPoolId: string): Effect.Effect<
  {
    issuer: string;
    jwksUri: string;
  },
  JwtVerifyError
> {
  return Effect.try({
    try: () => CognitoJwtVerifier.parseUserPoolId(userPoolId),
    catch: toJwtVerifyError,
  });
}
