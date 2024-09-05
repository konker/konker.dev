import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './basic-auth';

describe('basic-auth', () => {
  describe('validateBasicAuthToken', () => {
    it('should work as expected in the positive case', () => {
      const actual = unit.validateBasicAuthToken(['secret1'])('secret1');
      expect(actual).toStrictEqual(P.Effect.succeed(true));
    });

    it('should work as expected in the positive case', () => {
      const actual = unit.validateBasicAuthToken(['secret0', 'secret1'])('secret1');
      expect(actual).toStrictEqual(P.Effect.succeed(true));
    });

    it('should work as expected in the negative case', () => {
      const actual = unit.validateBasicAuthToken(['secret1'])('bad-secret');
      expect(actual).toStrictEqual(P.Effect.succeed(false));
    });

    it('should work as expected in the negative case', () => {
      const actual = unit.validateBasicAuthToken(['secret0', 'secret1'])('bad-secret');
      expect(actual).toStrictEqual(P.Effect.succeed(false));
    });
  });
});
