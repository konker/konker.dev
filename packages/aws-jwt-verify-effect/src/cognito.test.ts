import { CognitoJwtVerifier } from 'aws-jwt-verify';
import * as httpsLib from 'aws-jwt-verify/https';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import * as unit from './cognito.js';
import { generateKeyPair, type KeyPair, signJwt } from './test/utils.js';

describe('aws-jwt-verify-effect/cognito', () => {
  const TEST_USER_POOL_ID = 'eu-west-1_74fcba108';
  const TEST_CLIENT_ID = 'test-client-id';
  const TEST_ISSUER = 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_74fcba108';

  // ------------------------------------------------------------------------
  describe('defaultAwsJwtVerifierFactory', () => {
    it('should work as expected', async () => {
      expect(
        unit.defaultAwsCognitoJwtVerifierFactory({
          userPoolId: TEST_USER_POOL_ID,
        })
      ).toBeInstanceOf(CognitoJwtVerifier);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultAwsJwtVerifierMultiFactory', () => {
    it('should work as expected', async () => {
      expect(
        unit.defaultAwsCognitoJwtVerifierMultiFactory({
          userPoolId: TEST_USER_POOL_ID,
          clientId: TEST_CLIENT_ID,
          tokenUse: 'access',
        })
      ).toBeInstanceOf(CognitoJwtVerifier);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultAwsJwtVerifierFactoryDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.AwsCognitoJwtVerifierFactoryDeps,
        Effect.map((deps) => deps.awsCognitoJwtVerifierFactory),
        unit.defaultAwsCognitoJwtVerifierFactoryDeps
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(Function);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultAwsJwtVerifierDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.AwsCognitoJwtVerifierDeps(),
        Effect.map((deps) => deps.awsJwtVerifier),
        unit.defaultCognitoAwsJwtVerifierDeps({
          userPoolId: TEST_USER_POOL_ID,
        })
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(CognitoJwtVerifier);
    });
  });

  // ------------------------------------------------------------------------
  describe('awsCognitoParseUserPoolId', () => {
    it('should work as expected', async () => {
      const actualEffect = unit.awsCognitoParseUserPoolId(TEST_USER_POOL_ID);
      const actual = Effect.runSync(actualEffect);
      expect(actual).toStrictEqual({
        issuer: 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_74fcba108',
        jwksUri: 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_74fcba108/.well-known/jwks.json',
      });
    });
  });

  // ------------------------------------------------------------------------
  describe('awsCognitoJwtVerifierVerify', () => {
    let keypair: KeyPair;
    const MOCK_NOW_ISO = '2025-03-29T12:13:14Z';

    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(MOCK_NOW_ISO));

      keypair = generateKeyPair();

      vi.spyOn(httpsLib.SimpleFetcher.prototype, 'fetch').mockImplementation(async () =>
        Buffer.from(JSON.stringify(keypair.jwks))
      );
    });

    afterAll(() => {
      vi.clearAllTimers();
      vi.clearAllMocks();
    });

    it('should work as expected', async () => {
      const signedJwt = signJwt(
        { kid: keypair.jwk.kid },
        { aud: TEST_CLIENT_ID, iss: TEST_ISSUER, hello: 'world', token_use: 'id' },
        keypair.privateKey
      );

      const verifierDeps = unit.defaultCognitoAwsJwtVerifierDeps({
        userPoolId: TEST_USER_POOL_ID,
        tokenUse: 'id', // needs to be specified here or upon calling verify
        clientId: TEST_CLIENT_ID,
        // groups: 'admins',
        // graceSeconds: 0,
        // scope: 'my-api/read',
      });
      const actualEffect = pipe(unit.awsCognitoJwtVerifierVerify(signedJwt), verifierDeps);
      const actual = await Effect.runPromise(actualEffect);
      expect(actual).toStrictEqual({
        aud: 'test-client-id',
        exp: 1743250494,
        hello: 'world',
        iss: 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_74fcba108',
        token_use: 'id',
      });
    });
  });
});
