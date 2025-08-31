import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './index.js';

describe('http', () => {
  describe('UNKNOWN_STRING_EFFECT', () => {
    it('should work as expected', () => {
      expect(Effect.runSync(unit.UNKNOWN_STRING_EFFECT())).toStrictEqual('UNKNOWN');
    });
  });
});
