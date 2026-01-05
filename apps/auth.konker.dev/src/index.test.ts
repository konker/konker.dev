import { describe, expect, it } from 'vitest';

import * as unit from './index.js';

describe('index', () => {
  it('should pass', () => {
    expect(unit.VERSION).toEqual('0.0.1');
  });
});
