import { describe, expect, it } from 'vitest';

import { createEmptyGameRecord } from './types';

describe('createEmptyGameRecord', () => {
  it('defaults metadata date to the current record date', () => {
    expect(createEmptyGameRecord('2026-03-30T15:45:00.000Z').metadata.date).toBe('2026-03-30');
  });
});
