import { describe, expect, it } from 'vitest';

import * as unit from './consts.js';

// Silly test for coverage
describe('consts', () => {
  it('should have the expected values', () => {
    expect(unit.DYNAMODB_ERROR_CONDITIONAL_CHECK_FAILED).toEqual('ConditionalCheckFailedException');
  });
});
