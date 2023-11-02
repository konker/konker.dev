import * as unit from './index';

describe('index', () => {
  describe('f', () => {
    it('should work as expected', () => {
      expect(unit.f(1, 2)).toEqual(3);
    });
  });

  describe('g', () => {
    it('should work as expected', async () => {
      expect(await unit.g()).toEqual('pupka');
    });
  });
});
