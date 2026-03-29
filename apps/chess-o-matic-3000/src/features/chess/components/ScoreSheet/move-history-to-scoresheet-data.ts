import type { GameHistoryMove } from '../../../../game-model';
import type { ScoreSheetData, ScoreSheetDataItem } from './types';
import { SCORESHEET_EMPTY } from './types';

export function moveHistoryToScoreSheetData(moveHistory: Array<GameHistoryMove>): ScoreSheetData {
  if (moveHistory.length === 0) {
    return SCORESHEET_EMPTY;
  }

  const scoreSheetData: ScoreSheetData = [];

  // eslint-disable-next-line fp/no-loops
  for (let index = 0; index < moveHistory.length; index += 2) {
    const whiteMove = moveHistory[index];
    const blackMove = moveHistory[index + 1];

    scoreSheetData.push(createScoreSheetDataItem(whiteMove?.san ?? '', blackMove?.san));
  }

  return scoreSheetData;
}

function createScoreSheetDataItem(whiteMove: string, blackMove: string | undefined): ScoreSheetDataItem {
  if (blackMove === undefined) {
    return [whiteMove, '*'];
  }

  return [whiteMove, blackMove];
}
