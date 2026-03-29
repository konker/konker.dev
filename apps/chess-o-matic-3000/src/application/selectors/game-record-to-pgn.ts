import { Chess } from 'chess.js';

import type { GameRecord } from '../../domain/game/types';
import { applyGameMetadata } from './apply-game-metadata';

export function gameRecordToPgn(game: GameRecord): string {
  const chess = new Chess();
  applyGameMetadata(chess, game.metadata);

  game.moveHistory.forEach((move) => {
    chess.move(move.san);
  });

  return chess.pgn();
}
