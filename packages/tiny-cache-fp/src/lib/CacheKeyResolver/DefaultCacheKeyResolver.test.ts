import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import * as unit from './DefaultCacheKeyResolver';

describe('DefaultCacheKeyResolver', () => {
  it('should work as expected with string input', () => {
    const actual = pipe('test-input', unit.DefaultCacheKeyResolver());
    expect(Effect.runSync(actual)).toEqual('test-input');
  });

  it('should work as expected with non-string input', () => {
    const actual = pipe(123, unit.DefaultCacheKeyResolver());
    expect(Effect.runSync(actual)).toEqual('123');
  });
});
