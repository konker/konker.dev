import { Copy, CopyCheck } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createEffect, createSignal, For, Show } from 'solid-js';

import type { PgnMoveListData, PgnMoveListItem } from './types';

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
  const [isCopied, setIsCopied] = createSignal(false);

  createEffect(function resetCopiedState(): void {
    props.pgn;
    setIsCopied(false);
  });

  async function copyPgn(): Promise<void> {
    await navigator.clipboard.writeText(props.pgn);
    setIsCopied(true);
  }

  function showMoveNumber(item: PgnMoveListItem): boolean {
    return item.side === 'white';
  }

  function renderMoveClasses(item: PgnMoveListItem): string {
    if (props.currentPly === item.ply) {
      return 'border-black bg-slate-200 font-semibold';
    }

    if (props.currentPly < item.ply) {
      return 'border-slate-300 bg-white text-slate-400';
    }

    return 'border-slate-300 bg-white';
  }

  function switchToMovesTab(): void {
    setActiveTab(PGN_PANEL_TAB_MOVES);
  }

  function switchToRawTab(): void {
    setActiveTab(PGN_PANEL_TAB_RAW);
  }

  function renderMovesTab(): JSX.Element {
    return (
      <div aria-label="PGN Moves" class="flex h-64 flex-wrap content-start items-center gap-2 overflow-y-auto pr-2">
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
    return <textarea aria-label="PGN" class="h-64 w-full resize-y" readOnly value={props.pgn} />;
  }

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span>PGN</span>
        <button class="flex items-center gap-2" onClick={() => void copyPgn()} type="button">
          <Show when={isCopied()} fallback={<Copy class="h-4 w-4" />}>
            <CopyCheck class="h-4 w-4" />
          </Show>
          <span>{isCopied() ? 'Copied' : 'Copy PGN'}</span>
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
