import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';

import type { PgnMoveListData, PgnMoveListItem } from './PgnPanel/types';

const PGN_PANEL_TAB_MOVES = 'moves';
const PGN_PANEL_TAB_RAW = 'raw';

type PgnPanelTab = typeof PGN_PANEL_TAB_MOVES | typeof PGN_PANEL_TAB_RAW;

type PgnPanelProps = {
  readonly currentPly: number;
  readonly onGoToPly: (ply: number) => void;
  readonly pgn: string;
  readonly pgnMoveList: PgnMoveListData;
};

export function PgnPanel(props: PgnPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = createSignal<PgnPanelTab>(PGN_PANEL_TAB_MOVES);

  async function copyPgn(): Promise<void> {
    await navigator.clipboard.writeText(props.pgn);
  }

  function showMoveNumber(item: PgnMoveListItem): boolean {
    return item.side === 'white';
  }

  function renderMoveClasses(item: PgnMoveListItem): string {
    return props.currentPly === item.ply ? 'border-black bg-slate-200' : 'border-slate-300 bg-white';
  }

  function switchToMovesTab(): void {
    setActiveTab(PGN_PANEL_TAB_MOVES);
  }

  function switchToRawTab(): void {
    setActiveTab(PGN_PANEL_TAB_RAW);
  }

  function renderMovesTab(): JSX.Element {
    return (
      <div aria-label="PGN Moves" class="flex flex-wrap items-center gap-2">
        <Show when={props.pgnMoveList.length > 0} fallback={<span>No moves yet</span>}>
          <For each={props.pgnMoveList}>
            {(item) => (
              <>
                <Show when={showMoveNumber(item)}>
                  <span class="tabular-nums text-sm">{item.moveNumber}.</span>
                </Show>
                <button
                  class={`rounded-full border px-3 py-1 text-sm ${renderMoveClasses(item)}`}
                  onClick={() => props.onGoToPly(item.ply)}
                  type="button"
                >
                  {item.san}
                </button>
              </>
            )}
          </For>
        </Show>
      </div>
    );
  }

  function renderRawTab(): JSX.Element {
    return <textarea aria-label="PGN" class="min-h-32 w-full resize-y" readOnly value={props.pgn} />;
  }

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span>PGN</span>
        <button onClick={() => void copyPgn()} type="button">
          Copy PGN
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          aria-pressed={activeTab() === PGN_PANEL_TAB_MOVES}
          class="border border-slate-300 px-2 py-1"
          onClick={switchToMovesTab}
          type="button"
        >
          Moves
        </button>
        <button
          aria-pressed={activeTab() === PGN_PANEL_TAB_RAW}
          class="border border-slate-300 px-2 py-1"
          onClick={switchToRawTab}
          type="button"
        >
          Raw PGN
        </button>
      </div>

      <Show when={activeTab() === PGN_PANEL_TAB_MOVES} fallback={renderRawTab()}>
        {renderMovesTab()}
      </Show>
    </div>
  );
}
