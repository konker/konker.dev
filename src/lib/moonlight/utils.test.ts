import { describe, expect, it } from 'vitest';

import * as unit from './utils';

describe('utils', () => {
  describe('pairWise', () => {
    it('should work as expected', () => {
      expect(unit.pairWise([1, 2, 3, 4])).toStrictEqual([
        [1, 2],
        [2, 3],
        [3, 4],
      ]);
    });
  });
});
