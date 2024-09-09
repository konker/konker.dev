import * as P from '@konker.dev/effect-ts-prelude';

import * as jwt from 'jsonwebtoken';

import { TEST_JWT_NOW_MS, TEST_SIGNED_PAYLOAD } from '../test/fixtures/jwt';
import {
  TEST_TOKEN,
  TEST_TOKEN_MISSING_ISSUER,
  TEST_TOKEN_MISSING_SUBJECT,
  TEST_TOKEN_STRING_PAYLOAD,
} from '../test/fixtures/test-jwt-tokens';
import * as unit from './common';

describe('jwt/common', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('checkJwtPayloadIssSub', () => {
    it('should verify a valid token', () => {
      const actual = unit.checkJwtPayloadIssSub(jwt.decode(TEST_TOKEN));
      expect(P.Effect.runSync(actual)).toStrictEqual(TEST_SIGNED_PAYLOAD);
    });

    it('should return an error if the token is invalid, missing issuer', () => {
      const actual = unit.checkJwtPayloadIssSub(jwt.decode(TEST_TOKEN_MISSING_ISSUER));
      expect(() => P.Effect.runSync(actual)).toThrow('Invalid token payload: missing iss or sub');
    });

    it('should return an error if the token is invalid, missing subject', () => {
      const actual = unit.checkJwtPayloadIssSub(jwt.decode(TEST_TOKEN_MISSING_SUBJECT));
      expect(() => P.Effect.runSync(actual)).toThrow('missing iss or sub');
    });

    it('should return an error if the token is invalid, string payload', () => {
      const actual = unit.checkJwtPayloadIssSub(jwt.decode(TEST_TOKEN_STRING_PAYLOAD));
      expect(() => P.Effect.runSync(actual)).toThrow('Invalid token payload: string');
    });
    it('should return an error if the token is invalid, null', () => {
      const actual = unit.checkJwtPayloadIssSub(jwt.decode('banana'));
      expect(() => P.Effect.runSync(actual)).toThrow('Invalid token payload: null');
    });
  });
});
