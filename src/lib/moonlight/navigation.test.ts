/* eslint-disable @typescript-eslint/naming-convention */
import { describe, expect, it } from 'vitest';

import * as unit from './navigation';
import { createPathLookup } from './navigation';

describe('navigation', () => {
  const TEST_ALL_ITEMS = [
    { depth: 1, path: '/foo' },
    { depth: 1, path: '/bar' },
    { depth: 2, path: '/bar/baz' },
    { depth: 3, path: '/bar/baz/A' },
    { depth: 3, path: '/bar/baz/B' },
    { depth: 3, path: '/bar/baz/C' },
    { depth: 2, path: '/bar/qux' },
    { depth: 3, path: '/bar/qux/A' },
    { depth: 3, path: '/bar/qux/B' },
    { depth: 3, path: '/bar/qux/C' },
  ];
  const TEST_ITEMS_DEPTH_GROUP = [
    { depth: 1, path: '/foo' },
    { depth: 1, path: '/bar' },
    [
      { depth: 2, path: '/bar/baz' },
      [
        { depth: 3, path: '/bar/baz/A' },
        { depth: 3, path: '/bar/baz/B' },
        { depth: 3, path: '/bar/baz/C' },
      ],
      { depth: 2, path: '/bar/qux' },
      [
        { depth: 3, path: '/bar/qux/A' },
        { depth: 3, path: '/bar/qux/B' },
        { depth: 3, path: '/bar/qux/C' },
      ],
    ],
  ];
  const TEST_PATH_LOOKUP = {
    '/foo': [{ depth: 1, path: '/foo' }],
    '/bar': [{ depth: 1, path: '/bar' }],
    '/bar/baz': [
      { depth: 1, path: '/bar' },
      { depth: 2, path: '/bar/baz' },
    ],
    '/bar/baz/A': [
      { depth: 1, path: '/bar' },
      { depth: 2, path: '/bar/baz' },
      { depth: 3, path: '/bar/baz/A' },
    ],
    '/bar/baz/B': [
      { depth: 1, path: '/bar' },
      { depth: 2, path: '/bar/baz' },
      { depth: 3, path: '/bar/baz/B' },
    ],
    '/bar/baz/C': [
      { depth: 1, path: '/bar' },
      { depth: 2, path: '/bar/baz' },
      { depth: 3, path: '/bar/baz/C' },
    ],
    '/bar/qux': [
      { depth: 1, path: '/bar' },
      { depth: 2, path: '/bar/qux' },
    ],
    '/bar/qux/A': [
      { depth: 1, path: '/bar' },
      { depth: 2, path: '/bar/qux' },
      { depth: 3, path: '/bar/qux/A' },
    ],
    '/bar/qux/B': [
      { depth: 1, path: '/bar' },
      { depth: 2, path: '/bar/qux' },
      { depth: 3, path: '/bar/qux/B' },
    ],
    '/bar/qux/C': [
      { depth: 1, path: '/bar' },
      { depth: 2, path: '/bar/qux' },
      { depth: 3, path: '/bar/qux/C' },
    ],
  };

  describe('groupItemsByDepth', () => {
    it('should work as expected', () => {
      expect(unit.groupItemsByDepth([])).toStrictEqual([]);
      expect(unit.groupItemsByDepth([{ depth: 1, path: '/foo' }])).toStrictEqual([{ depth: 1, path: '/foo' }]);
      expect(unit.groupItemsByDepth(TEST_ALL_ITEMS)).toStrictEqual(TEST_ITEMS_DEPTH_GROUP);
      expect(
        unit.groupItemsByDepth([{ depth: 1 }, { depth: 1 }, { depth: 2 }, { depth: 3 }, { depth: 1 }])
      ).toStrictEqual([{ depth: 1 }, { depth: 1 }, [{ depth: 2 }, [{ depth: 3 }]], { depth: 1 }]);
    });
  });

  describe('createPathLookup', () => {
    it('should work as expected', () => {
      expect(createPathLookup([], [])).toStrictEqual({});
      expect(createPathLookup([{ depth: 1, path: '/foo' }], [{ depth: 1, path: '/foo' }])).toStrictEqual({
        '/foo': [{ depth: 1, path: '/foo' }],
      });
      expect(createPathLookup(TEST_ALL_ITEMS, TEST_ITEMS_DEPTH_GROUP)).toStrictEqual(TEST_PATH_LOOKUP);
    });
  });
});
