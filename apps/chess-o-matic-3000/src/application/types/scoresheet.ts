export type ScoreSheetDataItemHalf = [string, '*'];
export type ScoreSheetDataItemFull = [string, string];
export type ScoreSheetDataItem = ScoreSheetDataItemHalf | ScoreSheetDataItemFull;

export type ScoreSheetData = Array<ScoreSheetDataItem>;

export const SCORESHEET_EMPTY: ScoreSheetData = [] as const;
