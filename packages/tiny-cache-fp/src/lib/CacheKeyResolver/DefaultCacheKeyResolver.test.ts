import * as P from '@konker.dev/effect-ts-prelude';
import { describe, expect, it } from 'vitest';

import * as unit from './DefaultCacheKeyResolver';

describe('DefaultCacheKeyResolver', () => {
  it('should work as expected with string input', () => {
    const actual = P.pipe('test-input', unit.DefaultCacheKeyResolver());
    expect(P.Effect.runSync(actual)).toEqual('test-input');
  });

  it('should work as expected with non-string input', () => {
    const actual = P.pipe(123, unit.DefaultCacheKeyResolver());
    expect(P.Effect.runSync(actual)).toEqual('123');
  });
});
