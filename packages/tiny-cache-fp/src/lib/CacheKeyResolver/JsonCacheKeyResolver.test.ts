import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import * as unit from './JsonCacheKeyResolver';

describe('JsonCacheKeyResolver', () => {
  it('should work as expected with string input', () => {
    const actual = pipe('test-input', unit.JsonCacheKeyResolver());
    expect(Effect.runSync(actual)).toEqual('"test-input"');
  });

  it('should work as expected with an object input', () => {
    const actual = pipe({ foo: 'abc', bar: 123 }, unit.JsonCacheKeyResolver());
    expect(Effect.runSync(actual)).toEqual('{"foo":"abc","bar":123}');
  });
});
