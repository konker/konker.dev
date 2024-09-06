import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './index';

const TEST_NOW_MS = 1671573808123;
const TEST_PAYLOAD = { foo: 'bar', sub: 'test-sub' };
const TEST_SIGNING_CONFIG: unit.JwtSigningConfig = {
  signingSecret: 'shhhhh',
  issuer: 'test-iss',
  maxTtlSec: 3600,
};
const TEST_VERIFICATION_CONFIG: unit.JwtVerificationConfig = {
  signingSecret: 'shhhhh',
  issuer: 'test-iss',
};
const TEST_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4LCJpc3MiOiJ0ZXN0LWlzcyJ9.IfZ_IlbKl2S7pkKBqTis0kyBmDuXGbBkCdCkrDdLq_Q';
const TEST_SIGNED_PAYLOAD = {
  foo: 'bar',
  iat: Math.floor(TEST_NOW_MS / 1000),
  exp: Math.floor(TEST_NOW_MS / 1000) + 3600,
  iss: 'test-iss',
  sub: 'test-sub',
};
const TEST_TOKEN_EXPIRED =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2NzE1NzM4MDAsImV4cCI6MTY3MTU3MzgwMSwiaXNzIjoib3RoZXIifQ.hqHdbRzB4HqiYA1FRADQwR7RUE22N7vMsPGwDsvwdMo';
const TEST_TOKEN_OTHER_ISSUER =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2NzE1NzQ0MzYsImV4cCI6MTY3MTU4NDQzNiwiaXNzIjoib3RoZXIifQ.lW7nOIQNHlFAv5dfzivR-V-ufHiZ4MTNo1IPyQXoZ8k';
const TEST_TOKEN_MISSING_ISSUER =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2NzE1NzQ0MzYsImV4cCI6MTY3MTU4NDQzNiwiaXNzIjoib3RoZXIifQ.lW7nOIQNHlFAv5dfzivR-V-ufHiZ4MTNo1IPyQXoZ8k';
const TEST_TOKEN_MISSING_SUBJECT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2NzE1NzM4MDgsImV4cCI6MTY3MTU3NzQwOCwiaXNzIjoidGVzdC1pc3MifQ.G5yi_IPSIj5GZp2jz4aV3DfdTotwUy3xivHlU79_ppc';
const TEST_TOKEN_STRING_PAYLOAD = 'eyJhbGciOiJIUzI1NiJ9.anVzdCBhIHN0cmluZw.WY-fOyNQW58U_kiDUfXPP5m_Bsl2_0Jj0AvVgsrRwWE';

describe('jwt', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(TEST_NOW_MS);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('jwtSignToken', () => {
    it('should sign a token', () => {
      const actual = unit.jwtSignToken(TEST_PAYLOAD, TEST_SIGNING_CONFIG);
      expect(P.Effect.runSync(actual)).toBe(TEST_TOKEN);
    });
  });

  describe('jwtVerifyToken', () => {
    it('should verify a valid token', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN, TEST_VERIFICATION_CONFIG);
      expect(P.Effect.runSync(actual)).toStrictEqual(TEST_SIGNED_PAYLOAD);
    });

    it('should return an error if the token is invalid, wrong secret', () => {
      const actual = unit.jwtVerifyToken(
        TEST_TOKEN,
        Object.assign({}, TEST_VERIFICATION_CONFIG, { signingSecret: 'wrong' })
      );
      expect(() => P.Effect.runSync(actual)).toThrow('invalid signature');
    });

    it('should return an error if the token is invalid, expired', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_EXPIRED, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('jwt expired');
    });

    it('should return an error if the token is invalid, wrong issuer', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_OTHER_ISSUER, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('jwt issuer invalid');
    });

    it('should return an error if the token is invalid, missing issuer', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_MISSING_ISSUER, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('jwt issuer invalid');
    });

    it('should return an error if the token is invalid, missing subject', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_MISSING_SUBJECT, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('missing iss or sub');
    });

    it('should return an error if the token is invalid, string payload', () => {
      const actual = unit.jwtVerifyToken(TEST_TOKEN_STRING_PAYLOAD, TEST_VERIFICATION_CONFIG);
      expect(() => P.Effect.runSync(actual)).toThrow('jwt issuer invalid');
    });
  });
});
