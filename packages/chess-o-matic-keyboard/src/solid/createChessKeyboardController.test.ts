import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';

import { createChessKeyboardController } from './createChessKeyboardController.js';

describe('solid/createChessKeyboardController', () => {
  it('should drive free input and expose derived SAN matches', () => {
    createRoot((dispose) => {
      const keyboard = createChessKeyboardController({
        context: {
          legalMovesSan: ['Nf3', 'Nc3', 'e4'],
        },
      });

      keyboard.pressKey('piece-knight');
      const state = keyboard.pressKey('file-f');

      expect(state.input).toBe('Nf');
      expect(state.matchingMoves).toStrictEqual(['Nf3']);

      dispose();
    });
  });
});
