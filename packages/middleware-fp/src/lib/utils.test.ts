import { describe, expect, it } from 'vitest';

import * as unit from './utils.js';

describe('middleware/utils', () => {
  describe('sanitizeRecord', () => {
    it('should work as expected', () => {
      expect(unit.sanitizeRecord({ foo: 'abc', bar: undefined })).toStrictEqual({
        foo: 'abc',
        bar: '',
      });

      expect(unit.sanitizeRecord({})).toStrictEqual({});
      expect(unit.sanitizeRecord(undefined)).toStrictEqual({});
    });
  });
});
