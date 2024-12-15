import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import * as unit from './helpers.js';

describe('authentication/helpers', () => {
  describe('extractBearerToken', () => {
    it('should behave as expected with good input', () => {
      const actual = unit.extractBearerToken('Bearer SOME_TOKEN');
      expect(Effect.runSync(actual)).toEqual('SOME_TOKEN');
    });

    it('should behave as expected with bad input', () => {
      const actual = unit.extractBearerToken('CareBearer: SOME_TOKEN');
      expect(() => Effect.runSync(actual)).toThrow();
    });
  });

  describe('extractBasicAuthHeaderValue', () => {
    it('should behave as expected with good input', () => {
      const actual = unit.extractBasicAuthHeaderValue('Basic SOME_TOKEN');
      expect(Effect.runSync(actual)).toEqual('SOME_TOKEN');
    });

    it('should behave as expected with bad input', () => {
      const actual = unit.extractBasicAuthHeaderValue('CareBasic: SOME_TOKEN');
      expect(() => Effect.runSync(actual)).toThrow();
    });
  });
});
