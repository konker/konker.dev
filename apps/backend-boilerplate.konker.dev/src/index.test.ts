import { describe, expect, it } from 'vitest';

import * as unit from './index.js';

describe('index', () => {
  it('should work as expected', () => {
    expect(unit.HELLO).toEqual('hello');
  });
});
