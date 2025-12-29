/**
 * AwsSsmProvider Tests
 */
import { describe, expect, it } from 'vitest';

import { awsSsmProvider } from './AwsSsmProvider.js';

describe('AwsSsmProvider', () => {
  it('should expose expected provider metadata', () => {
    expect(awsSsmProvider.name).toBe('aws-ssm');
    expect(awsSsmProvider.capabilities.secureWrite).toBe(true);
    expect(awsSsmProvider.capabilities.encryptionVerification).toBe(true);
    expect(awsSsmProvider.capabilities.transactions).toBe(false);
  });
});
