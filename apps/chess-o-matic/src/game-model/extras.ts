import type { Chess, Square } from 'chess.js';

// --------------------------------------------------------------------------
export type IsLegalMove = {
  (coords: [Square, Square]): boolean;
  (san: string): boolean;
};

// --------------------------------------------------------------------------
export const chessIsLegalMove = (chess: Chess): IsLegalMove => {
  const fn = (arg: [Square, Square] | string): boolean => {
    try {
      const moveOptions =
        typeof arg === 'string'
          ? arg // It's a SAN string
          : { from: arg[0], to: arg[1], promotion: 'q' };

      const move = chess.move(moveOptions);

      if (move) {
        // Valid move found, undo to preserve state
        chess.undo();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return fn as IsLegalMove;
};
