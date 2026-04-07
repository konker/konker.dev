import { describe, expect, it } from 'vitest';

import { createInitialKeyboardModel, deriveKeyboardState, reduceKeyboardModel, submitKeyboardModel } from './state.js';
import { DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS } from './types.js';

describe('core/state', () => {
  it('should allow free input even when it is not legal', () => {
    const state = deriveKeyboardState('Qa9', undefined, 'primary', DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS);

    expect(state.input).toBe('Qa9');
    expect(state.matchingMoves).toStrictEqual([]);
    expect(state.exactMatches).toStrictEqual([]);
    expect(state.shouldAutoSubmit).toBe(false);
  });

  it('should derive matching moves, exact matches, and auto-submit from legal SAN strings', () => {
    const state = deriveKeyboardState(
      'Nf3',
      { legalMovesSan: ['Nf3', 'Nc3', 'e4'] },
      'primary',
      DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS
    );

    expect(state.matchingMoves).toStrictEqual(['Nf3']);
    expect(state.exactMatches).toStrictEqual(['Nf3']);
    expect(state.autoSubmitMatch).toBe('Nf3');
    expect(state.shouldAutoSubmit).toBe(true);
  });

  it('should highlight keys whose append preserves a legal SAN prefix', () => {
    const state = deriveKeyboardState(
      'N',
      { legalMovesSan: ['Nf3', 'Nc3', 'e4'] },
      'primary',
      DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS
    );

    expect(state.highlightedKeyIds).toStrictEqual(new Set(['file-f', 'file-c']));
  });

  it('should support reducer-style controlled input updates and settings toggles', () => {
    const model = reduceKeyboardModel(
      reduceKeyboardModel(createInitialKeyboardModel({ legalMovesSan: ['e4'] }), {
        input: 'e',
        type: 'set-input',
      }),
      {
        settings: { autoSubmit: false, keyHighlights: false },
        type: 'set-settings',
      }
    );

    expect(model.state.input).toBe('e');
    expect(model.state.settings.autoSubmit).toBe(false);
    expect(model.state.settings.keyHighlights).toBe(false);
    expect(model.state.highlightedKeyIds).toStrictEqual(new Set());
  });

  it('should always emit submit events even for illegal input', () => {
    const submitEvent = submitKeyboardModel(
      reduceKeyboardModel(createInitialKeyboardModel(), {
        input: 'Qa9',
        type: 'set-input',
      }),
      'manual'
    );

    expect(submitEvent.input).toBe('Qa9');
    expect(submitEvent.exactLegalMatch).toBeUndefined();
    expect(submitEvent.source).toBe('manual');
  });
});
