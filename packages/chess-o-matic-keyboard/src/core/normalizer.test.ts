import { describe, expect, it } from 'vitest';

import { normalizeInput } from './normalizer.js';

describe('core/normalizer', () => {
  it('should strip whitespace from SAN-style input', () => {
    expect(normalizeInput('  N f3  ')).toBe('Nf3');
    expect(normalizeInput(' O-O   + ')).toBe('O-O+');
  });
});
