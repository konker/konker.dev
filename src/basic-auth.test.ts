import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './basic-auth';

describe('basic-auth', () => {
  describe('basicAuthDecodeHeaderValue', () => {
    it('should work as expected with valid input', () => {
      const actual = unit.basicAuthDecodeHeaderValue('Zm9vOmJhcg==');
      expect(P.Effect.runSync(actual)).toStrictEqual({
        username: 'foo',
        password: 'bar',
      });
    });

    it('should fail as expected with invalid base64 input', () => {
      const actual = unit.basicAuthDecodeHeaderValue('===');
      expect(() => P.Effect.runSync(actual)).toThrow();
    });

    it('should fail as expected with invalid base64 input', () => {
      const actual = unit.basicAuthDecodeHeaderValue('bm9jb2xvbg==');
      expect(() => P.Effect.runSync(actual)).toThrow('Invalid basic auth payload');
    });
  });

  describe('basicAuthValidateCredentials', () => {
    it('should work as expected in the positive case', () => {
      const actual = unit.basicAuthValidateCredentials([{ passwords: ['secret1'] }])({
        username: 'irrelevant',
        password: 'secret1',
      });
      expect(actual).toStrictEqual(P.Effect.succeed(true));
    });

    it('should work as expected in the positive case', () => {
      const actual = unit.basicAuthValidateCredentials([{ username: 'user0', passwords: ['secret1'] }])({
        username: 'user0',
        password: 'secret1',
      });
      expect(actual).toStrictEqual(P.Effect.succeed(true));
    });

    it('should work as expected in the positive case', () => {
      const actual = unit.basicAuthValidateCredentials([{ passwords: ['secret0', 'secret1'] }])({
        username: 'irrelevant',
        password: 'secret1',
      });
      expect(actual).toStrictEqual(P.Effect.succeed(true));
    });

    it('should work as expected in the positive case', () => {
      const actual = unit.basicAuthValidateCredentials([{ passwords: ['secret0', 'secret1'] }])({
        password: 'secret1',
      });
      expect(actual).toStrictEqual(P.Effect.succeed(true));
    });

    it('should work as expected in the negative case', () => {
      const actual = unit.basicAuthValidateCredentials([{ passwords: ['secret1'] }])({
        username: 'irrelevant',
        password: 'bad-secret',
      });
      expect(actual).toStrictEqual(P.Effect.succeed(false));
    });

    it('should work as expected in the negative case', () => {
      const actual = unit.basicAuthValidateCredentials([{ passwords: ['secret0', 'secret1'] }])({
        username: 'irrelevant',
        password: 'bad-secret',
      });
      expect(actual).toStrictEqual(P.Effect.succeed(false));
    });

    it('should work as expected in the negative case', () => {
      const actual = unit.basicAuthValidateCredentials([{ passwords: ['secret0', 'secret1'] }])({
        password: 'bad-secret',
      });
      expect(actual).toStrictEqual(P.Effect.succeed(false));
    });

    it('should work as expected in the negative case', () => {
      const actual = unit.basicAuthValidateCredentials([{ username: 'user0', passwords: ['secret0', 'secret1'] }])({
        username: 'not-user0',
        password: 'secret0',
      });
      expect(actual).toStrictEqual(P.Effect.succeed(false));
    });
  });
});
