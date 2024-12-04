import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './JsonHashCacheKeyResolver';

describe('JsonHashCacheKeyResolver', () => {
  it('should work as expected with string input', () => {
    const actual = P.pipe('test-input', unit.JsonHashCacheKeyResolver());
    expect(P.Effect.runSync(actual)).toEqual('3698e7bc52b7f4e15832c1bdf0295f02');
  });

  it('should work as expected with an object input', () => {
    const actual1 = P.pipe({ foo: 'abc', bar: 123 }, unit.JsonHashCacheKeyResolver());
    expect(P.Effect.runSync(actual1)).toEqual('af8c0c9943b3c1d3f0d71cddc7d716fe');

    const actual2 = P.pipe({ foo: 'Abc', bar: 223 }, unit.JsonHashCacheKeyResolver());
    expect(P.Effect.runSync(actual2)).toEqual('06c653ab45aaca7d7df8a3bce95e536a');
  });
});