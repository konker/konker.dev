import { describe, expect, test } from 'vitest';

import * as unit from './index';

describe('lib', () => {
  test('toDisplayDate', () => {
    expect(unit.toDisplayDate(new Date('2024-01-02'))).toBe('2024-01-02');
  });

  test('toReadableDate', () => {
    expect(unit.toReadableDate(new Date('2024-01-02'))).toBe('Tuesday 2nd January 2024');
  });

  test('getUrlPathParts', () => {
    expect(unit.getUrlPathParts(new URL('http://localhost:4321/'))).toEqual([]);
    expect(unit.getUrlPathParts(new URL('http://localhost:4321/til/'))).toEqual(['til']);
    expect(unit.getUrlPathParts(new URL('http://localhost:4321/til/til-1/'))).toEqual(['til', 'til-1']);
    expect(unit.getUrlPathParts(new URL('http://localhost:4321/til/til-1'))).toEqual(['til', 'til-1']);
  });
});
