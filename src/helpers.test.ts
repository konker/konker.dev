import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './helpers';

describe('authentication', () => {
  describe('extractToken', () => {
    it('should behave as expected with good input', () => {
      const actual = P.Effect.runSync(unit.extractToken('Bearer SOME_TOKEN'));
      expect(actual).toEqual('SOME_TOKEN');
    });

    it('should behave as expected with bad input', () => {
      const actual = unit.extractToken('CareBearer: SOME_TOKEN');
      expect(() => P.Effect.runSync(actual)).toThrow();
    });
  });
});
