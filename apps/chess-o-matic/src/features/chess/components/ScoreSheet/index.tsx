import type { JSX } from 'solid-js';
import { For } from 'solid-js';

import type { ScoreSheetData, ScoreSheetDataItem } from './types';

type ScoreSheetProps = {
  readonly scoresheet: ScoreSheetData;
};

export function ScoreSheet(props: ScoreSheetProps): JSX.Element {
  function renderBlackMove(item: ScoreSheetDataItem): string {
    return item[1] === '*' ? '' : item[1];
  }

  return (
    <section aria-label="Scoresheet" class="flex flex-col gap-2">
      <div class="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-x-4 border-b border-slate-300 pb-2 text-sm font-semibold">
        <span>#</span>
        <span>White</span>
        <span>Black</span>
      </div>

      <div class="flex flex-col gap-1">
        <For each={props.scoresheet}>
          {(item, index) => (
            <div class="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-x-4 text-sm leading-6">
              <span class="tabular-nums">{index() + 1}.</span>
              <span>{item[0]}</span>
              <span>{renderBlackMove(item)}</span>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
