import type { Square } from 'chess.js';

import type { GameRecord } from '../../domain/game/types';
import type { ScoreSheetExportDocument, ScoreSheetExportFormat } from '../types/export';
import { SCORE_SHEET_EXPORT_FORMAT_PDF, SCORE_SHEET_EXPORT_FORMAT_TEXT } from '../types/export';
import { gameRecordToExportBaseName } from './game-record-to-export-base-name';
import { moveHistoryToScoreSheetData } from './move-history-to-scoresheet-data';

export function gameRecordToScoreSheetExportDocument(
  game: GameRecord,
  format: ScoreSheetExportFormat = SCORE_SHEET_EXPORT_FORMAT_TEXT
): ScoreSheetExportDocument {
  return {
    content: renderScoreSheetContent(game),
    fileName: `${gameRecordToExportBaseName(game)}-scoresheet.${format}`,
    format,
    mimeType: format === SCORE_SHEET_EXPORT_FORMAT_PDF ? 'application/pdf' : 'text/plain',
  };
}

function renderScoreSheetContent(game: GameRecord): string {
  const rows = moveHistoryToScoreSheetData(
    game.moveHistory.map((move) => ({
      ...move,
      from: move.from as Square,
      to: move.to as Square,
    }))
  ).map(([white, black], index) => `${index + 1}. ${white} ${black}`.trimEnd());

  const metadataRows = [
    ['Event', game.metadata.event],
    ['Site', game.metadata.site],
    ['Date', game.metadata.date],
    ['Round', game.metadata.round],
    ['White', game.metadata.white.name],
    ['WhiteElo', game.metadata.white.elo],
    ['Black', game.metadata.black.name],
    ['BlackElo', game.metadata.black.elo],
    ['TimeControl', game.metadata.timeControl],
    ['Termination', game.metadata.termination],
  ]
    .filter(([, value]) => value.trim() !== '')
    .map(([label, value]) => `${label}: ${value}`);

  return [...metadataRows, '', ...rows].join('\n').trim();
}
