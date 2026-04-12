import { Ear } from 'lucide-solid';
import type { JSX } from 'solid-js';

import type { GameModelEvaluateStatus } from '../../../game-model/evaluate';

type StatusPanelProps = {
  readonly currentMoveColor: 'white' | 'black';
  readonly currentMoveNumber: number;
  readonly gameOverReason?: string;
  readonly gameResult?: string;
  readonly isGameOver: boolean;
  readonly status: GameModelEvaluateStatus;
  readonly illegalReason?: 'ambiguous' | 'invalid';
  readonly lastMoveColor?: 'black' | 'white';
  readonly lastMovePiece?: 'bishop' | 'king' | 'knight' | 'pawn' | 'queen' | 'rook';
  readonly lastMoveSan: string;
  readonly message: string;
  readonly sanitizedInput: string;
};

export function StatusPanel(props: StatusPanelProps): JSX.Element {
  function renderDisplayMessage(): string {
    return props.message === props.lastMoveSan ? '' : props.message;
  }

  function renderChipMessage(): string {
    const displayMessage = renderDisplayMessage();

    if (displayMessage !== '') {
      return displayMessage;
    }

    if (props.status === 'ok') {
      return 'OK';
    }

    return props.lastMoveSan || 'No move yet';
  }

  function scrollPanelToTop(): void {
    const panelEl = document.getElementById('status');
    if (panelEl instanceof HTMLElement) {
      const targetTop = window.scrollY + panelEl.getBoundingClientRect().top;
      window.scrollTo({
        behavior: 'smooth',
        top: targetTop,
      });
    }
  }

  function renderLastMovePieceSrc(): string | undefined {
    if (!props.lastMovePiece || !props.lastMoveColor) {
      return undefined;
    }

    return `/images/pieces/staunty/${props.lastMovePiece}.${props.lastMoveColor}.svg`;
  }

  return (
    <section
      class="status-surface"
      data-illegal-reason={props.status === 'illegal' ? props.illegalReason : undefined}
      data-status={props.status}
      id="status"
    >
      <span aria-label="Last Input Evaluate Status" class="status-chip status-floating-chip">
        {renderChipMessage()}
      </span>
      <button
        aria-label="Last Input SAN"
        class="status-san status-san-button cursor-pointer pr-28 text-left"
        onClick={scrollPanelToTop}
        type="button"
      >
        {renderLastMovePieceSrc() ? (
          <img alt="" aria-hidden="true" class="status-move-piece" src={renderLastMovePieceSrc()} />
        ) : null}
        {props.lastMoveSan || '-'}
      </button>
      {props.isGameOver ? (
        <div aria-label="Game Over Summary" class="status-game-over">
          <span class="status-chip">Game over</span>
          <span class="status-game-over-reason">{props.gameOverReason ?? 'Game over'}</span>
          <span aria-label="Game Result" class="status-game-over-result">
            {props.gameResult ?? '-'}
          </span>
        </div>
      ) : null}
      <div class="status-footer-row">
        <div class="flex flex-wrap items-start gap-2">
          <span class="status-heard-label">
            <Ear aria-hidden="true" class="h-4 w-4" />
            <span class="sr-only">Last Input</span>
          </span>
          <span aria-label="Last Input Sanitized" class="status-heard-value">
            {props.sanitizedInput || 'No input yet'}
          </span>
        </div>
        <span class="status-panel-move-indicator">
          <span class="status-chip status-move-chip">{props.currentMoveNumber}</span>
          <span
            aria-label={`${props.currentMoveColor} to move`}
            class={`status-color-chip status-color-chip-${props.currentMoveColor}`}
          />
        </span>
      </div>
    </section>
  );
}
