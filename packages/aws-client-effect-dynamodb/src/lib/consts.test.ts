import * as unit from './consts';

// Silly test for coverage
describe('consts', () => {
  it('should have the expected values', () => {
    expect(unit.DYNAMODB_ERROR_CONDITIONAL_CHECK_FAILED).toEqual('ConditionalCheckFailedException');
  });
});
