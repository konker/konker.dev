import { JwtVerifier } from 'aws-jwt-verify';
import * as httpsLib from 'aws-jwt-verify/https';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import * as unit from './index.js';
import { generateKeyPair, type KeyPair, signJwt } from './test/utils.js';

describe('aws-jwt-verify-effect', () => {
  const TEST_ISSUER = 'https://example.com/test-issuer';
  const TEST_AUDIENCE = 'test-audience';

  describe('Error tag', () => {
    it('should export as expected', () => {
      expect(unit.AWS_JWT_VERIFIER_ERROR_TAG).toEqual('JwtVerifyError');
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultAwsJwtVerifierFactory', () => {
    it('should work as expected', async () => {
      expect(
        unit.defaultAwsJwtVerifierFactory({
          issuer: TEST_ISSUER,
        })
      ).toBeInstanceOf(JwtVerifier);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultAwsJwtVerifierMultiFactory', () => {
    it('should work as expected', async () => {
      expect(
        unit.defaultAwsJwtVerifierMultiFactory({
          issuer: TEST_ISSUER,
          audience: TEST_AUDIENCE,
        })
      ).toBeInstanceOf(JwtVerifier);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultAwsJwtVerifierFactoryDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.AwsJwtVerifierFactoryDeps,
        Effect.map((deps) => deps.awsJwtVerifierFactory),
        unit.defaultAwsJwtVerifierFactoryDeps
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(Function);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultAwsJwtVerifierDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.AwsJwtVerifierDeps(),
        Effect.map((deps) => deps.awsJwtVerifier),
        unit.defaultAwsJwtVerifierDeps({
          issuer: TEST_ISSUER,
          audience: TEST_AUDIENCE,
        })
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(JwtVerifier);
    });
  });

  // ------------------------------------------------------------------------
  describe('awsJwtVerifierVerify', () => {
    let keypair: KeyPair;
    const MOCK_NOW_ISO = '2025-03-29T12:13:14Z';

    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(MOCK_NOW_ISO));

      keypair = generateKeyPair();

      vi.spyOn(httpsLib.SimpleFetcher.prototype, 'fetch').mockImplementation(
        async () => Buffer.from(JSON.stringify(keypair.jwks)) as never // This is needed for some reason
      );
    });

    afterAll(() => {
      vi.clearAllTimers();
      vi.clearAllMocks();
    });

    it('should work as expected', async () => {
      const signedJwt = signJwt(
        { kid: keypair.jwk.kid },
        { aud: TEST_AUDIENCE, iss: TEST_ISSUER, hello: 'world', token_use: 'id' },
        keypair.privateKey
      );

      const verifierDeps = unit.defaultAwsJwtVerifierDeps({
        issuer: TEST_ISSUER,
        audience: TEST_AUDIENCE,
      });

      const actualEffect = pipe(unit.awsJwtVerifierVerify([signedJwt]), verifierDeps);
      const actual = await Effect.runPromise(actualEffect);
      expect(actual).toStrictEqual({
        aud: 'test-audience',
        exp: 1743250494,
        hello: 'world',
        iss: 'https://example.com/test-issuer',
        token_use: 'id',
      });
    });
  });
});
