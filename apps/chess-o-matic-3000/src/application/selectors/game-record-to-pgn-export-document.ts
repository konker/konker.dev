import type { GameRecord } from '../../domain/game/types';
import type { PgnExportDocument } from '../types/export';
import { gameRecordToExportBaseName } from './game-record-to-export-base-name';
import { gameRecordToPgn } from './game-record-to-pgn';

export function gameRecordToPgnExportDocument(game: GameRecord): PgnExportDocument {
  return {
    fileName: `${gameRecordToExportBaseName(game)}.pgn`,
    mimeType: 'application/x-chess-pgn',
    pgn: gameRecordToPgn(game),
  };
}
