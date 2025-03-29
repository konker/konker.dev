import { JwtVerifier } from 'aws-jwt-verify';
import type { JwksCache } from 'aws-jwt-verify/jwk';
import type { JwtPayload } from 'aws-jwt-verify/jwt-model';
import type { VerifyProperties } from 'aws-jwt-verify/jwt-verifier';
import { type JwtVerifierMultiProperties } from 'aws-jwt-verify/jwt-verifier';
import { type JwtVerifierMultiIssuer } from 'aws-jwt-verify/jwt-verifier';
import { type JwtVerifierSingleIssuer } from 'aws-jwt-verify/jwt-verifier';
import { type JwtVerifierProperties } from 'aws-jwt-verify/jwt-verifier';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { JwtVerifyError } from './lib/error.js';
import { toJwtVerifyError } from './lib/error.js';

export { TAG as AWS_JWT_VERIFIER_ERROR_TAG } from './lib/error.js';

// --------------------------------------------------------------------------
export type AwsJwtVerifierFactory = <T extends JwtVerifierProperties<VerifyProperties>>(
  verifyProperties: T & JwtVerifierProperties<VerifyProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) => JwtVerifierSingleIssuer<T>;

export const defaultAwsJwtVerifierFactory: AwsJwtVerifierFactory = <T extends JwtVerifierProperties<VerifyProperties>>(
  verifyProperties: T & JwtVerifierProperties<VerifyProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) => JwtVerifier.create(verifyProperties, additionalProperties);

// --------------------------------------------------------------------------
export type AwsJwtVerifierMultiFactory = <T extends JwtVerifierMultiProperties<VerifyProperties>>(
  verifyProperties: T & JwtVerifierMultiProperties<VerifyProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) => JwtVerifierMultiIssuer<T>;

export const defaultAwsJwtVerifierMultiFactory: AwsJwtVerifierMultiFactory = <
  T extends JwtVerifierMultiProperties<VerifyProperties>,
>(
  verifyProperties: T & JwtVerifierMultiProperties<VerifyProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) => JwtVerifier.create(verifyProperties, additionalProperties);

// --------------------------------------------------------------------------
export type AwsJwtVerifierFactoryDeps = {
  readonly awsJwtVerifierFactory: AwsJwtVerifierFactory | AwsJwtVerifierMultiFactory;
};
export const AwsJwtVerifierFactoryDeps = Context.GenericTag<AwsJwtVerifierFactoryDeps>(
  '@aws-jwt-verify-effect/AwsJwtVerifierFactoryDeps'
);

export const defaultAwsJwtVerifierFactoryDeps = Effect.provideService(
  AwsJwtVerifierFactoryDeps,
  AwsJwtVerifierFactoryDeps.of({
    awsJwtVerifierFactory: defaultAwsJwtVerifierFactory,
  })
);

// --------------------------------------------------------------------------
export type AwsJwtVerifierDeps<
  SpecificVerifyProperties extends Partial<VerifyProperties>,
  IssuerConfig extends JwtVerifierProperties<SpecificVerifyProperties>,
  MultiIssuer extends boolean,
> = {
  readonly awsJwtVerifier: JwtVerifier<SpecificVerifyProperties, IssuerConfig, MultiIssuer>;
};
export const AwsJwtVerifierDeps = <
  SpecificVerifyProperties extends Partial<VerifyProperties>,
  IssuerConfig extends JwtVerifierProperties<SpecificVerifyProperties>,
  MultiIssuer extends boolean,
>() =>
  Context.GenericTag<AwsJwtVerifierDeps<SpecificVerifyProperties, IssuerConfig, MultiIssuer>>(
    'aws-jwt-verify-effect/AwsJwtVerifierDeps'
  );

export const defaultAwsJwtVerifierDeps = <
  T extends JwtVerifierProperties<VerifyProperties> | JwtVerifierMultiProperties<VerifyProperties>,
>(
  verifyProperties: T & JwtVerifierProperties<VerifyProperties>,
  additionalProperties?: {
    jwksCache: JwksCache;
  }
) =>
  Effect.provideService(
    AwsJwtVerifierDeps(),
    AwsJwtVerifierDeps().of({
      awsJwtVerifier: defaultAwsJwtVerifierFactory<T>(verifyProperties, additionalProperties),
    })
  );

// --------------------------------------------------------------------------
type VerifyParameters<SpecificVerifyProperties> =
  Record<string, never> extends SpecificVerifyProperties
    ? [jwt: string, props?: SpecificVerifyProperties]
    : [jwt: string, props: SpecificVerifyProperties];

export const awsJwtVerifierVerify = <
  SpecificVerifyProperties extends Partial<VerifyProperties>,
  IssuerConfig extends JwtVerifierProperties<SpecificVerifyProperties>,
  MultiIssuer extends boolean,
>(
  params: VerifyParameters<SpecificVerifyProperties>
): Effect.Effect<
  JwtPayload,
  JwtVerifyError,
  AwsJwtVerifierDeps<SpecificVerifyProperties, IssuerConfig, MultiIssuer>
> => {
  return pipe(
    AwsJwtVerifierDeps<SpecificVerifyProperties, IssuerConfig, MultiIssuer>(),
    Effect.flatMap((deps) =>
      Effect.tryPromise({ try: () => deps.awsJwtVerifier.verify(...params), catch: toJwtVerifyError })
    )
  );
};
