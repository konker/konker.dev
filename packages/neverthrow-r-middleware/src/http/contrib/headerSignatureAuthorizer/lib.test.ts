import { describe, expect, it } from 'vitest';

import { validateHeaderSignature } from './lib.js';

describe('headerSignatureAuthorizer/lib', () => {
  it('returns false when the signature is missing', () => {
    const result = validateHeaderSignature(undefined, 'body', 'secret')(undefined);

    expect(result.isOk() && result.value).toBe(false);
  });
});
