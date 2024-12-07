import * as P from '@konker.dev/effect-ts-prelude';
import { describe, expect, it } from 'vitest';

import * as unit from './hash';

describe('index', () => {
  describe('md5Hex', () => {
    it('should work as expected', () => {
      const actual = unit.md5Hex('test').pipe(P.Effect.runSync);
      expect(actual).toEqual('098f6bcd4621d373cade4e832627b4f6');
    });
  });

  describe('sha256Hex', () => {
    it('should work as expected', () => {
      const actual = unit.sha256Hex('test').pipe(P.Effect.runSync);
      expect(actual).toEqual('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
    });
  });

  describe('sha256HmacHex', () => {
    it('should work as expected', () => {
      const actual = unit.sha256HmacHex('test', 'secret').pipe(P.Effect.runSync);
      expect(actual).toEqual('0329a06b62cd16b33eb6792be8c60b158d89a2ee3a876fce9a881ebb488c0914');
    });
  });
});
