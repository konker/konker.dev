import type { Chess } from 'chess.js';

import type { GameBoardOrientation } from '../../domain/game/types';
import type { GameMoveFlags } from '../types/game-move-flags';

export function resolveGameMoveFlags(chess: Chess, boardOrientation: GameBoardOrientation): GameMoveFlags {
  const lastMoveSan = chess.history().at(-1);
  const lastMoveColor = chess.turn();

  return {
    isBottomMove:
      (boardOrientation === 'white' && lastMoveColor === 'b') ||
      (boardOrientation === 'black' && lastMoveColor === 'w'),
    isCapture: lastMoveSan?.includes('x') ?? false,
    isCastle: lastMoveSan?.includes('O-O') ?? false,
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    isEnd: chess.isGameOver(),
    isPromotion: lastMoveSan?.includes('=') ?? false,
  };
}
