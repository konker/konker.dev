import { describe, expect, it } from 'vitest';

import { pgnToScoreSheetData } from './pgn-to-scoresheet-data';

describe('pgnToScoreSheetData', () => {
  it('returns an empty scoresheet for empty PGN', () => {
    expect(pgnToScoreSheetData('')).toEqual([]);
  });

  it('groups SAN moves into full-move rows', () => {
    expect(pgnToScoreSheetData('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6')).toEqual([
      ['e4', 'e5'],
      ['Nf3', 'Nc6'],
      ['Bb5', 'a6'],
    ]);
  });

  it('uses a half-move row marker when black has not moved yet', () => {
    expect(pgnToScoreSheetData('1. e4')).toEqual([['e4', '*']]);
  });
});
