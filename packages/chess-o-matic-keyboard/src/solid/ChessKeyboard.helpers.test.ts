import { describe, expect, it } from 'vitest';

import { DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS } from '../core/types.js';
import { areSettingsEqual, areStringListsEqual } from './ChessKeyboard.helpers.js';

describe('solid/ChessKeyboard.helpers', () => {
  describe('areSettingsEqual', () => {
    it('should return true for identical settings', () => {
      expect(areSettingsEqual(DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS, DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS)).toBe(true);
    });

    it('should return false when a setting differs', () => {
      expect(
        areSettingsEqual(DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS, {
          ...DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS,
          allowOmittedXInPieceCaptures: !DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS.allowOmittedXInPieceCaptures,
        })
      ).toBe(false);
    });
  });

  describe('areStringListsEqual', () => {
    it('should return true for equal lists with the same values in the same order', () => {
      expect(areStringListsEqual(['Nf3', 'Nc3'], ['Nf3', 'Nc3'])).toBe(true);
    });

    it('should return false for equal values in a different order', () => {
      expect(areStringListsEqual(['Nf3', 'Nc3'], ['Nc3', 'Nf3'])).toBe(false);
    });

    it('should handle undefined lists', () => {
      expect(areStringListsEqual(undefined, undefined)).toBe(true);
      expect(areStringListsEqual(undefined, ['Nf3'])).toBe(false);
      expect(areStringListsEqual(['Nf3'], undefined)).toBe(false);
    });
  });
});
