import type { JSX } from 'solid-js';
import { For } from 'solid-js';

import type { ScoreSheetData, ScoreSheetDataItem } from './types';

type ScoreSheetProps = {
  readonly scoresheet: ScoreSheetData;
};

const SCORESHEET_MIN_ROWS = 10;

export function ScoreSheet(props: ScoreSheetProps): JSX.Element {
  function renderBlackMove(item: ScoreSheetDataItem): string {
    return item[1] === '*' ? '' : item[1];
  }

  function createDisplayRows(): Array<ScoreSheetDataItem | undefined> {
    const rowCount = Math.max(SCORESHEET_MIN_ROWS, props.scoresheet.length);
    return Array.from({ length: rowCount }, function mapRow(_value, index): ScoreSheetDataItem | undefined {
      return props.scoresheet[index];
    });
  }

  return (
    <section aria-label="Scoresheet" class="flex flex-col gap-2">
      <div class="flex h-64 flex-col gap-1 overflow-y-auto pr-2">
        <For each={createDisplayRows()}>
          {(item, index) => (
            <div
              aria-label="Scoresheet Row"
              class="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-x-4 border-b border-black text-sm leading-6"
            >
              <span class="tabular-nums">{index() + 1}.</span>
              <span>{item ? item[0] : ''}</span>
              <span>{item ? renderBlackMove(item) : ''}</span>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
