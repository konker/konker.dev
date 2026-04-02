import { ExternalLink } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { Show } from 'solid-js';

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
  return (
    <div class="utility-panel">
      <div class="utility-toolbar">
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
