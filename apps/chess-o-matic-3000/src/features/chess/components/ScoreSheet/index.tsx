import type { JSX } from 'solid-js';
import { createEffect, For, onCleanup } from 'solid-js';

import type { ScoreSheetData, ScoreSheetDataItem } from './types';

type ScoreSheetProps = {
  readonly currentPly: number;
  readonly isOpen?: boolean;
  readonly onGoToPly: (ply: number) => void;
  readonly scoresheet: ScoreSheetData;
};

const SCORESHEET_MIN_ROWS = 10;

export function ScoreSheet(props: ScoreSheetProps): JSX.Element {
  let scrollEl: HTMLDivElement | undefined;
  let scrollFrame: number | undefined;

  function renderBlackMove(item: ScoreSheetDataItem): string {
    return item[1] === '*' ? '' : item[1];
  }

  function renderMoveClasses(ply: number): string {
    if (props.currentPly === ply) {
      return 'scoresheet-move-button-current font-semibold underline';
    }

    if (props.currentPly < ply) {
      return 'scoresheet-move-button-future';
    }

    return '';
  }

  function createDisplayRows(): Array<ScoreSheetDataItem | undefined> {
    const rowCount = Math.max(SCORESHEET_MIN_ROWS, props.scoresheet.length);
    return Array.from({ length: rowCount }, function mapRow(_value, index): ScoreSheetDataItem | undefined {
      return props.scoresheet[index];
    });
  }

  function scrollToBottom(): void {
    if (!scrollEl) {
      return;
    }

    if (scrollFrame !== undefined) {
      cancelAnimationFrame(scrollFrame);
    }

    scrollFrame = requestAnimationFrame(() => {
      if (scrollEl) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    });
  }

  createEffect(() => {
    props.isOpen;
    props.scoresheet.length;

    if (props.isOpen) {
      scrollToBottom();
    }
  });

  onCleanup(() => {
    if (scrollFrame !== undefined) {
      cancelAnimationFrame(scrollFrame);
    }
  });

  return (
    <section aria-label="Scoresheet" class="scoresheet-shell">
      <div class="scoresheet-scroll" ref={scrollEl}>
        <For each={createDisplayRows()}>
          {(item, index) => (
            <div
              aria-label="Scoresheet Row"
              class={`scoresheet-row ${item && (props.currentPly === index() * 2 + 1 || props.currentPly === index() * 2 + 2) ? 'scoresheet-row-active' : ''}`}
            >
              <span class="scoresheet-index">{index() + 1}.</span>
              <span class="scoresheet-move-cell">
                {item ? (
                  <button
                    class={`scoresheet-move-button ${renderMoveClasses(index() * 2 + 1)}`}
                    onClick={() => props.onGoToPly(index() * 2 + 1)}
                    type="button"
                  >
                    {item[0]}
                  </button>
                ) : (
                  ''
                )}
              </span>
              <span class="scoresheet-move-cell">
                {item && item[1] !== '*' ? (
                  <button
                    class={`scoresheet-move-button ${renderMoveClasses(index() * 2 + 2)}`}
                    onClick={() => props.onGoToPly(index() * 2 + 2)}
                    type="button"
                  >
                    {renderBlackMove(item)}
                  </button>
                ) : (
                  ''
                )}
              </span>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
