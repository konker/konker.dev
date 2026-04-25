/* eslint-disable fp/no-rest-parameters */
import type { Chess, Move, Square } from 'chess.js';

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

// --------------------------------------------------------------------------
export type ChessMoveOk = {
  ok: true;
  move: Move;
};

export type ChessMoveIllegal = {
  ok: false;
  message: string;
};

export type ChessMove = ChessMoveOk | ChessMoveIllegal;

// --------------------------------------------------------------------------
export type ChessMoveSafeParams = Parameters<typeof Chess.prototype.move>;

export type ChessMoveSafe = (...x: ChessMoveSafeParams) => ChessMove;

export const chessMoveSafe =
  (chess: Chess): ChessMoveSafe =>
  (...params: ChessMoveSafeParams): ChessMove => {
    try {
      const result = chess.move(...params);

      if (result) {
        return { ok: true, move: result };
      }
      return { ok: false, message: `Illegal move: ${JSON.stringify(params)}` };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : String(e) };
    }
  };
