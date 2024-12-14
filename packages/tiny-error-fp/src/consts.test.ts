import { describe, expect, it } from 'vitest';

import * as unit from './consts.js';

describe('consts', () => {
  describe('TINY_ERROR_UNKNOWN_STRING', () => {
    it('should work as expected', () => {
      expect(unit.TINY_ERROR_UNKNOWN_STRING()).toEqual('UNKNOWN');
    });
  });
});
