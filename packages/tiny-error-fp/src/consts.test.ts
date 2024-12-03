import * as unit from './consts';

describe('consts', () => {
  describe('TINY_ERROR_UNKNOWN_STRING', () => {
    it('should work as expected', () => {
      expect(unit.TINY_ERROR_UNKNOWN_STRING()).toEqual('UNKNOWN');
    });
  });
});
