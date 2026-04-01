import { Copy, CopyCheck, ExternalLink } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createEffect, createSignal, Show } from 'solid-js';

import type { PgnMoveListData } from './types';

type PgnPanelProps = {
  readonly currentPly: number;
  readonly disabled?: boolean;
  readonly onOpenChessDotCom?: () => void;
  readonly onOpenLichess?: () => void;
  readonly onGoToPly: (ply: number) => void;
  readonly pgn: string;
  readonly pgnMoveList: PgnMoveListData;
};

export function PgnPanel(props: PgnPanelProps): JSX.Element {
  const [isCopied, setIsCopied] = createSignal(false);

  createEffect(function resetCopiedState(): void {
    props.pgn;
    setIsCopied(false);
  });

  async function copyPgn(): Promise<void> {
    await navigator.clipboard.writeText(props.pgn);
    setIsCopied(true);
  }

  return (
    <div class="utility-panel">
      <div class="utility-toolbar">
        <button class="toolbar-button" disabled={props.disabled} onClick={() => void copyPgn()} type="button">
          <Show when={isCopied()} fallback={<Copy class="h-4 w-4" />}>
            <CopyCheck class="h-4 w-4" />
          </Show>
          <span>{isCopied() ? 'Copied' : 'Copy PGN'}</span>
        </button>

        <Show when={props.onOpenLichess}>
          <button class="toolbar-button" disabled={props.disabled} onClick={props.onOpenLichess} type="button">
            <ExternalLink class="h-4 w-4" />
            <span>Open in Lichess</span>
          </button>
        </Show>

        <Show when={props.onOpenChessDotCom}>
          <button class="toolbar-button" disabled={props.disabled} onClick={props.onOpenChessDotCom} type="button">
            <ExternalLink class="h-4 w-4" />
            <span>Open in Chess.com</span>
          </button>
        </Show>
      </div>
      <textarea aria-label="PGN" class="utility-textarea" readOnly value={props.pgn} />
    </div>
  );
}
