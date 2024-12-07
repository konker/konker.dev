import * as P from '@konker.dev/effect-ts-prelude';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  TEST_JWT_ISS,
  TEST_JWT_NOW_MS,
  TEST_JWT_PAYLOAD,
  TEST_JWT_SIGNING_SECRET,
  TEST_SIGNED_PAYLOAD,
} from '../test/fixtures/jwt';
import {
  TEST_TOKEN,
  TEST_TOKEN_EXPIRED,
  TEST_TOKEN_MISSING_ISSUER,
  TEST_TOKEN_MISSING_SUBJECT,
  TEST_TOKEN_OTHER_ISSUER,
  TEST_TOKEN_STRING_PAYLOAD,
} from '../test/fixtures/test-jwt-tokens';
import * as unit from './index';

export const TEST_SIGNING_CONFIG: unit.JwtSigningConfig = {
  signingSecret: TEST_JWT_SIGNING_SECRET,
  issuer: TEST_JWT_ISS,
  maxTtlSec: 3600,
};
export const TEST_VERIFICATION_CONFIG: unit.JwtVerificationConfig = {
  signingSecret: TEST_JWT_SIGNING_SECRET,
  issuer: TEST_JWT_ISS,
};

describe('jwt', () => {
  beforeAll(() => {
    vi.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('jwtDecodeToken', () => {
    it('should decode a token', () => {
      const actual = unit.jwtDecodeToken(TEST_TOKEN);
      expect(P.Effect.runSync(actual)).toStrictEqual(TEST_SIGNED_PAYLOAD);
    });

    it('should fail to decode a token with a string payload', () => {
      const actual = unit.jwtDecodeToken(TEST_TOKEN_STRING_PAYLOAD);
      expect(() => P.Effect.runSync(actual)).toThrow('Invalid token payload');
    });
  });

  describe('jwtSignToken', () => {
    it('should sign a token', () => {
      const actual = unit.jwtSignToken(TEST_JWT_PAYLOAD, TEST_SIGNING_CONFIG);
      expect(P.Effect.runSync(actual)).toBe(TEST_TOKEN);
    });
  });

  describe('jwtVerifyToken', () => {
    it('should verify a valid token', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({
        userId: 'test-sub',
        verified: true,
        ...TEST_SIGNED_PAYLOAD,
      });
    });

    it('should return an error if the token is invalid, wrong secret', () => {
      const actual = unit.jwtVerifyToken(
        TEST_TOKEN,
        Object.assign({}, TEST_VERIFICATION_CONFIG, { signingSecret: 'wrong' })
      );
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, expired', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_EXPIRED, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, wrong issuer', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_OTHER_ISSUER, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, missing issuer', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_MISSING_ISSUER, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, missing subject', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_MISSING_SUBJECT, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });

    it('should return an error if the token is invalid, string payload', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_STRING_PAYLOAD, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual({ verified: false });
    });
  });
});
