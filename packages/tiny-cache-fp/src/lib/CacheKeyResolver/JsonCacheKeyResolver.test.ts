import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './JsonCacheKeyResolver';

describe('JsonCacheKeyResolver', () => {
  it('should work as expected with string input', () => {
    const actual = P.pipe('test-input', unit.JsonCacheKeyResolver());
    expect(P.Effect.runSync(actual)).toEqual('"test-input"');
  });

  it('should work as expected with an object input', () => {
    const actual = P.pipe({ foo: 'abc', bar: 123 }, unit.JsonCacheKeyResolver());
    expect(P.Effect.runSync(actual)).toEqual('{"foo":"abc","bar":123}');
  });
});
