import type { Chess } from "chess.js";

import type { KeyboardContext } from "../core/types.js";

export function chessJsToKeyboardContext(chess: Chess): KeyboardContext {
  const legalMoves = chess.moves({ verbose: true }).map((move) => ({
    from: move.from,
    isCapture: move.flags.includes("c") || move.flags.includes("e"),
    piece: move.piece.toUpperCase() as "B" | "K" | "N" | "P" | "Q" | "R",
    san: move.san,
    to: move.to,
    uci: `${move.from}${move.to}${move.promotion ?? ""}`,
    ...(move.promotion === undefined
      ? {}
      : {
          promotion: move.promotion.toUpperCase() as "B" | "N" | "Q" | "R",
        }),
  }));

  return {
    checkState: chess.isCheckmate()
      ? "checkmate"
      : chess.inCheck()
        ? "check"
        : "safe",
    fen: chess.fen(),
    legalMoves,
    turn: chess.turn(),
  };
}
