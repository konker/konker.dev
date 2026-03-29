import { describe, expect, it } from 'vitest';

import { GAME_METADATA_EMPTY } from '../../domain/game/metadata';
import { createEmptyGameRecord } from '../../domain/game/types';
import { gameRecordToPgnExportDocument } from './game-record-to-pgn-export-document';
import { gameRecordToScoreSheetExportDocument } from './game-record-to-scoresheet-export-document';

describe('game record export selectors', () => {
  it('builds a PGN export document from a game record', () => {
    const game = {
      ...createEmptyGameRecord('2026-03-30T00:00:00.000Z', 'game-1'),
      metadata: {
        ...GAME_METADATA_EMPTY,
        black: { elo: '2050', name: 'Black Player' },
        event: 'Club Night',
        white: { elo: '2100', name: 'White Player' },
      },
      moveHistory: [
        { from: 'e2', san: 'e4', to: 'e4' },
        { from: 'e7', san: 'e5', to: 'e5' },
      ],
    };

    expect(gameRecordToPgnExportDocument(game)).toMatchObject({
      fileName: 'white-player-vs-black-player-2026-03-30.pgn',
      mimeType: 'application/x-chess-pgn',
      pgn: expect.stringContaining('[Event "Club Night"]'),
    });
  });

  it('builds a text scoresheet export document from a game record', () => {
    const game = {
      ...createEmptyGameRecord('2026-03-30T00:00:00.000Z', 'game-2'),
      metadata: {
        ...GAME_METADATA_EMPTY,
        event: 'Rapid',
      },
      moveHistory: [
        { from: 'e2', san: 'e4', to: 'e4' },
        { from: 'e7', san: 'e5', to: 'e5' },
        { from: 'g1', san: 'Nf3', to: 'f3' },
      ],
    };

    expect(gameRecordToScoreSheetExportDocument(game)).toEqual({
      content: 'Event: Rapid\n\n1. e4 e5\n2. Nf3 *',
      fileName: 'white-vs-black-2026-03-30-scoresheet.txt',
      format: 'txt',
      mimeType: 'text/plain',
    });
  });
});
