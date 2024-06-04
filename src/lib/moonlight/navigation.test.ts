import { describe, expect, it } from 'vitest';

import * as unit from './navigation';

describe('navigation', () => {
  describe('groupItemsByDepth', () => {
    it('should work as expected with an empty input', () => {
      expect(unit.groupItemsByDepth([])).toStrictEqual([]);
    });
  });
});
