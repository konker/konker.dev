import type { GameHistoryMove } from '../../game-model';
import type { PgnMoveListData } from '../types/pgn';
import { PGN_MOVE_LIST_EMPTY } from '../types/pgn';

export function moveHistoryToPgnMoveList(moveHistory: Array<GameHistoryMove>): PgnMoveListData {
  if (moveHistory.length === 0) {
    return PGN_MOVE_LIST_EMPTY;
  }

  return moveHistory.map(function mapMove(move, index) {
    return {
      moveNumber: Math.floor(index / 2) + 1,
      ply: index + 1,
      san: move.san,
      side: index % 2 === 0 ? 'white' : 'black',
    } as const;
  });
}
