import { describe, expect, it } from 'vitest';

import * as unit from './lib.js';

describe('middleware/sql-client-pg-init/lib', () => {
  describe('createDefaultPgSqlClientLayer', () => {
    it('should work as expected', async () => {
      const layer = unit.createDefaultPgSqlClientLayer();

      // TODO: better assertion?
      expect(layer).toBeDefined();
    });
  });
});
