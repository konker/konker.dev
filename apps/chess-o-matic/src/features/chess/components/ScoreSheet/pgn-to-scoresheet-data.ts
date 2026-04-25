import { parsePgn } from 'chessops/pgn';

import type { ScoreSheetData, ScoreSheetDataItem } from './types';
import { SCORESHEET_EMPTY } from './types';

export function pgnToScoreSheetData(pgn: string): ScoreSheetData {
  const parsedGames = parsePgn(pgn);
  const firstGame = parsedGames[0];

  if (!firstGame) {
    return SCORESHEET_EMPTY;
  }

  const moves = [...firstGame.moves.mainline()].map(function mapMove(move): string {
    return move.san;
  });

  if (moves.length === 0) {
    return SCORESHEET_EMPTY;
  }

  const scoreSheetData: ScoreSheetData = [];

  // eslint-disable-next-line fp/no-loops
  for (let index = 0; index < moves.length; index += 2) {
    const whiteMove = moves[index];
    const blackMove = moves[index + 1];

    scoreSheetData.push(createScoreSheetDataItem(whiteMove, blackMove));
  }

  return scoreSheetData;
}

function createScoreSheetDataItem(whiteMove: string, blackMove: string | undefined): ScoreSheetDataItem {
  if (blackMove === undefined) {
    return [whiteMove, '*'];
  }

  return [whiteMove, blackMove];
}
