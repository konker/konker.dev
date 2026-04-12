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
    expect(state.autoSubmitTarget).toBe('Nf3');
    expect(state.shouldAutoSubmit).toBe(true);
  });

  it('should auto-submit when a unique legal SAN ends with check suffix', () => {
    const state = deriveKeyboardState(
      'Bb5',
      { legalMovesSan: ['Bb5+', 'Nf3'] },
      'primary',
      DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS
    );

    expect(state.exactMatches).toStrictEqual([]);
    expect(state.autoSubmitTarget).toBe('Bb5+');
    expect(state.shouldAutoSubmit).toBe(true);
  });

  it('should auto-submit when a unique legal SAN ends with checkmate suffix', () => {
    const state = deriveKeyboardState(
      'Qh7',
      { legalMovesSan: ['Qh7#', 'Nf3'] },
      'primary',
      DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS
    );

    expect(state.exactMatches).toStrictEqual([]);
    expect(state.autoSubmitTarget).toBe('Qh7#');
    expect(state.shouldAutoSubmit).toBe(true);
  });

  it('should not auto-submit promotion SAN without the promotion suffix', () => {
    const state = deriveKeyboardState('e8', { legalMovesSan: ['e8=Q'] }, 'primary', DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS);

    expect(state.autoSubmitTarget).toBeUndefined();
    expect(state.shouldAutoSubmit).toBe(false);
  });

  it('should auto-submit on a unique partial match when enabled', () => {
    const state = deriveKeyboardState('Nf', { legalMovesSan: ['Nf3', 'Nc3'] }, 'primary', {
      ...DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS,
      autoSubmitOnSinglePartialMatch: true,
    });

    expect(state.matchingMoves).toStrictEqual(['Nf3']);
    expect(state.exactMatches).toStrictEqual([]);
    expect(state.autoSubmitTarget).toBe('Nf3');
    expect(state.shouldAutoSubmit).toBe(true);
  });

  it('should not auto-submit on a unique partial match when disabled', () => {
    const state = deriveKeyboardState('Nf', { legalMovesSan: ['Nf3', 'Nc3'] }, 'primary', {
      ...DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS,
      autoSubmitOnSinglePartialMatch: false,
    });

    expect(state.matchingMoves).toStrictEqual(['Nf3']);
    expect(state.autoSubmitTarget).toBeUndefined();
    expect(state.shouldAutoSubmit).toBe(false);
  });

  it('should not auto-submit on an ambiguous partial match', () => {
    const state = deriveKeyboardState('N', { legalMovesSan: ['Nf3', 'Nc3'] }, 'primary', {
      ...DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS,
      autoSubmitOnSinglePartialMatch: true,
    });

    expect(state.matchingMoves).toStrictEqual(['Nf3', 'Nc3']);
    expect(state.autoSubmitTarget).toBeUndefined();
    expect(state.shouldAutoSubmit).toBe(false);
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

  it('should not highlight keys before input when keyHighlightsMode is after-input', () => {
    const state = deriveKeyboardState('', { legalMovesSan: ['Nf3', 'Nc3', 'e4'] }, 'primary', {
      ...DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS,
      keyHighlightsMode: 'after-input',
    });

    expect(state.highlightedKeyIds).toStrictEqual(new Set());
  });

  it('should highlight keys after input when keyHighlightsMode is after-input', () => {
    const state = deriveKeyboardState('N', { legalMovesSan: ['Nf3', 'Nc3', 'e4'] }, 'primary', {
      ...DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS,
      keyHighlightsMode: 'after-input',
    });

    expect(state.highlightedKeyIds).toStrictEqual(new Set(['file-f', 'file-c']));
  });

  it('should support reducer-style controlled input updates and settings toggles', () => {
    const model = reduceKeyboardModel(
      reduceKeyboardModel(createInitialKeyboardModel({ legalMovesSan: ['e4'] }), {
        input: 'e',
        type: 'set-input',
      }),
      {
        settings: { autoSubmit: false, autoSubmitOnSinglePartialMatch: true, keyHighlightsMode: 'off' },
        type: 'set-settings',
      }
    );

    expect(model.state.input).toBe('e');
    expect(model.state.settings.autoSubmit).toBe(false);
    expect(model.state.settings.autoSubmitOnSinglePartialMatch).toBe(true);
    expect(model.state.settings.keyHighlightsMode).toBe('off');
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
    expect(submitEvent.resolvedLegalMatch).toBeUndefined();
    expect(submitEvent.source).toBe('manual');
  });
});
