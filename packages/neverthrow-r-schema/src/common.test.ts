import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';

import { DEFAULT_VALIDATION_MESSAGE, fromStandardSchemaResult } from './common.js';

const issue: StandardSchemaV1.Issue = { message: 'expected string' };

describe('common', () => {
  describe('fromStandardSchemaResult', () => {
    it('converts a successful Standard Schema result', () => {
      expect(fromStandardSchemaResult({ value: 42 })._unsafeUnwrap()).toBe(42);
    });

    it('wraps issues with the default message', () => {
      const result = fromStandardSchemaResult<string>({ issues: [issue] });
      expect(result._unsafeUnwrapErr()).toMatchObject({
        tag: 'SchemaValidationError',
        message: DEFAULT_VALIDATION_MESSAGE,
        issues: [issue],
      });
    });

    it('uses a custom message for issue failures', () => {
      const result = fromStandardSchemaResult<string>({ issues: [issue] }, { message: 'Body validation failed' });
      expect(result._unsafeUnwrapErr().message).toBe('Body validation failed');
    });
  });
});
