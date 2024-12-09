import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import * as unit from './basic-auth';

describe('basic-auth', () => {
  describe('BasicAuthUserContext', () => {
    it('should work as expected in the true case', () => {
      expect(unit.BasicAuthUserContext(true, 'user0')).toStrictEqual({
        verified: true,
        userId: 'user0',
      });
      expect(unit.BasicAuthUserContext(true, '')).toStrictEqual({
        verified: true,
      });
    });

    it('should work as expected in the false case', () => {
      expect(unit.BasicAuthUserContext(false)).toStrictEqual({
        verified: false,
      });
    });
  });

  describe('basicAuthCredentialMatch', () => {
    it('should work as expected', () => {
      expect(
        unit.basicAuthCredentialMatch({ username: 'user0', password: 'secret-0' })({
          username: 'user0',
          passwords: ['secret-0', 'secret-1'],
        })
      ).toStrictEqual(true);
      expect(
        unit.basicAuthCredentialMatch({ username: 'user0', password: 'secret-0' })({
          username: '*',
          passwords: ['secret-0', 'secret-1'],
        })
      ).toStrictEqual(true);
      expect(
        unit.basicAuthCredentialMatch({ username: '', password: 'secret-0' })({
          username: '*',
          passwords: ['secret-0', 'secret-1'],
        })
      ).toStrictEqual(true);
      expect(
        unit.basicAuthCredentialMatch({ username: 'user0', password: 'secret-0' })({
          username: 'user1',
          passwords: ['secret-0', 'secret-1'],
        })
      ).toStrictEqual(false);
      expect(
        unit.basicAuthCredentialMatch({ username: 'user0', password: 'secret-0' })({
          username: 'user0',
          passwords: ['secret-1'],
        })
      ).toStrictEqual(false);
    });
  });

  describe('basicAuthDecodeHeaderValue', () => {
    it('should work as expected with valid input', () => {
      const actual = unit.basicAuthDecodeHeaderValue('Zm9vOmJhcg==');
      expect(Effect.runSync(actual)).toStrictEqual({
        username: 'foo',
        password: 'bar',
      });
    });

    it('should fail as expected with undefined input', () => {
      const actual = unit.basicAuthDecodeHeaderValue(undefined);
      expect(() => Effect.runSync(actual)).toThrow();
    });

    it('should fail as expected with invalid base64 input', () => {
      const actual = unit.basicAuthDecodeHeaderValue('===');
      expect(() => Effect.runSync(actual)).toThrow();
    });

    it('should fail as expected with invalid base64 input', () => {
      const actual = unit.basicAuthDecodeHeaderValue('bm9jb2xvbg==');
      expect(() => Effect.runSync(actual)).toThrow('Invalid basic auth payload');
    });
  });

  describe('basicAuthVerifyCredentials', () => {
    it('should work as expected in the positive case', () => {
      const actual = unit.basicAuthVerifyCredentials([{ username: 'user0', passwords: ['secret1'] }])({
        username: 'user0',
        password: 'secret1',
      });
      expect(actual).toStrictEqual(
        Effect.succeed({
          verified: true,
          userId: 'user0',
        })
      );
    });

    it('should work as expected in the positive case', () => {
      const actual = unit.basicAuthVerifyCredentials([{ username: '', passwords: ['secret0', 'secret1'] }])({
        username: '',
        password: 'secret1',
      });
      expect(actual).toStrictEqual(
        Effect.succeed({
          verified: true,
        })
      );
    });

    it('should work as expected in the negative case', () => {
      const actual = unit.basicAuthVerifyCredentials([{ username: '', passwords: ['secret1'] }])({
        username: '',
        password: 'bad-secret',
      });
      expect(actual).toStrictEqual(
        Effect.succeed({
          verified: false,
        })
      );
    });

    it('should work as expected in the negative case', () => {
      const actual = unit.basicAuthVerifyCredentials([{ username: 'user0', passwords: ['secret0', 'secret1'] }])({
        username: 'not-user0',
        password: 'secret0',
      });
      expect(actual).toStrictEqual(Effect.succeed({ verified: false }));
    });
  });
});
