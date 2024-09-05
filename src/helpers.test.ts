import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './helpers';

describe('authentication/helpers', () => {
  describe('extractBearerToken', () => {
    it('should behave as expected with good input', () => {
      const actual = unit.extractBearerToken('Bearer SOME_TOKEN');
      expect(P.Effect.runSync(actual)).toEqual('SOME_TOKEN');
    });

    it('should behave as expected with bad input', () => {
      const actual = unit.extractBearerToken('CareBearer: SOME_TOKEN');
      expect(() => P.Effect.runSync(actual)).toThrow();
    });
  });

  describe('extractBasicAuthToken', () => {
    it('should behave as expected with good input', () => {
      const actual = unit.extractBasicAuthToken('Basic SOME_TOKEN');
      expect(P.Effect.runSync(actual)).toEqual('SOME_TOKEN');
    });

    it('should behave as expected with bad input', () => {
      const actual = unit.extractBasicAuthToken('CareBasic: SOME_TOKEN');
      expect(() => P.Effect.runSync(actual)).toThrow();
    });
  });
});
