import * as P from '@konker.dev/effect-ts-prelude';

import {
  TEST_JWT_ISS,
  TEST_JWT_NOW_MS,
  TEST_JWT_PAYLOAD,
  TEST_JWT_SUB,
  TEST_SIGNED_PAYLOAD,
} from '../test/fixtures/jwt';
import {
  TEST_RSA_KEY_PRIVATE,
  TEST_RSA_KEY_PUBLIC,
  TEST_RSA_KEY_PUBLIC_OTHER,
} from '../test/fixtures/test-jwt-rsa-keys';
import {
  TEST_TOKEN_RSA,
  TEST_TOKEN_RSA_EXPIRED,
  TEST_TOKEN_RSA_MISSING_ISSUER,
  TEST_TOKEN_RSA_MISSING_SUBJECT,
  TEST_TOKEN_RSA_OTHER_ISSUER,
  TEST_TOKEN_RSA_STRING_PAYLOAD,
} from '../test/fixtures/test-jwt-tokens-rsa';
import * as unit from './rsa';

const TEST_SIGNING_CONFIG: unit.JwtSigningConfigRsa = {
  rsaPrivateKey: TEST_RSA_KEY_PRIVATE,
  issuer: TEST_JWT_ISS,
  maxTtlSec: 3600,
};
const TEST_VERIFICATION_CONFIG: unit.JwtVerificationConfigRsa = {
  rsaPublicKey: TEST_RSA_KEY_PUBLIC,
  issuer: TEST_JWT_ISS,
};

describe('jwt/rsa', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('jwtSignTokenRsa', () => {
    it('should sign a token', () => {
      const actual = unit.jwtSignTokenRsa(TEST_JWT_PAYLOAD, TEST_SIGNING_CONFIG);
      expect(P.Effect.runSync(actual)).toBe(TEST_TOKEN_RSA);
    });
  });

  describe('jwtVerifyTokenRsa', () => {
    it('should verify a valid token', () => {
      const actual = unit.jwtVerifyTokenRsa(TEST_TOKEN_RSA, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: true, userId: TEST_JWT_SUB, ...TEST_SIGNED_PAYLOAD });
    });

    it('should return an error if the token is invalid, wrong key', () => {
      const actual = unit.jwtVerifyTokenRsa(
        TEST_TOKEN_RSA,
        Object.assign({}, TEST_VERIFICATION_CONFIG, { rsaPublicKey: TEST_RSA_KEY_PUBLIC_OTHER })
      );
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, expired', () => {
      const actual = unit.jwtVerifyTokenRsa(TEST_TOKEN_RSA_EXPIRED, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, wrong issuer', () => {
      const actual = unit.jwtVerifyTokenRsa(TEST_TOKEN_RSA_OTHER_ISSUER, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, missing issuer', () => {
      const actual = unit.jwtVerifyTokenRsa(TEST_TOKEN_RSA_MISSING_ISSUER, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, missing subject', () => {
      const actual = unit.jwtVerifyTokenRsa(TEST_TOKEN_RSA_MISSING_SUBJECT, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, string payload', () => {
      const actual = unit.jwtVerifyTokenRsa(TEST_TOKEN_RSA_STRING_PAYLOAD, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });
  });
});
