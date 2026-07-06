import { jwtAuthenticator } from '@konker.dev/middleware-fp/http/contrib';
import type { JwtVerificationConfig } from '@konker.dev/tiny-auth-utils-fp/jwt';
import { TEST_JWT_ISS, TEST_JWT_SIGNING_SECRET } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/jwt';
import { Config, Effect, Layer, pipe } from 'effect';

// --------------------------------------------------------------------------
export const JwtAuthLive = Layer.effect(
  jwtAuthenticator.JwtAuthenticatorDeps,
  pipe(
    Effect.all([Config.string('JWT_SIGNING_SECRET'), Config.string('JWT_ISSUER')]),
    Effect.map(([signingSecret, issuer]) => ({
      signingSecret,
      issuer,
    }))
  )
);

// --------------------------------------------------------------------------
export const JwtAuthTestConfig: JwtVerificationConfig = {
  signingSecret: TEST_JWT_SIGNING_SECRET,
  issuer: TEST_JWT_ISS,
};

export const JwtAuthTest = Layer.succeed(jwtAuthenticator.JwtAuthenticatorDeps, JwtAuthTestConfig);
