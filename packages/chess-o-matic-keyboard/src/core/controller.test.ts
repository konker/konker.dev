import { describe, expect, it } from 'vitest';

import { createKeyboardController } from './controller.js';

describe('core/controller', () => {
  it('should accept any entered input through key presses', () => {
    const controller = createKeyboardController();

    controller.pressKey('piece-queen');
    controller.pressKey('file-a');
    const state = controller.pressKey('rank-1');

    expect(state.input).toBe('Qa1');
  });

  it('should expose matching moves without blocking illegal input', () => {
    const controller = createKeyboardController({
      legalMovesSan: ['Nf3', 'Nc3', 'e4'],
    });

    controller.pressKey('piece-knight');
    const state = controller.pressKey('file-a');

    expect(state.input).toBe('Na');
    expect(state.matchingMoves).toStrictEqual([]);
  });

  it('should allow candidate selection and candidate-origin submission', () => {
    const controller = createKeyboardController({
      legalMovesSan: ['Nf3', 'Nc3', 'e4'],
    });

    controller.setInput('N');
    const state = controller.selectCandidate('Nf3');
    const submitEvent = controller.submit('candidate');

    expect(state.input).toBe('Nf3');
    expect(state.selectedCandidateId).toBe('Nf3');
    expect(submitEvent.source).toBe('candidate');
    expect(submitEvent.resolvedLegalMatch).toBe('Nf3');
  });

  it('should allow settings toggles to be updated independently', () => {
    const controller = createKeyboardController({
      legalMovesSan: ['e4'],
    });

    const state = controller.setSettings({
      autoSubmit: false,
      autoSubmitOnSinglePartialMatch: true,
      candidateBar: false,
    });

    expect(state.settings.autoSubmit).toBe(false);
    expect(state.settings.autoSubmitOnSinglePartialMatch).toBe(true);
    expect(state.settings.candidateBar).toBe(false);
    expect(state.settings.keyHighlightsMode).toBe('after-input');
  });
});
