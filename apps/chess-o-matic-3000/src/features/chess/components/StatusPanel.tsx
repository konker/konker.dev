import type { JSX } from 'solid-js';

import type { GameModelEvaluateStatus } from '../../../game-model/evaluate';

type StatusPanelProps = {
  readonly currentMoveColor: 'white' | 'black';
  readonly currentMoveNumber: number;
  readonly status: GameModelEvaluateStatus;
  readonly illegalReason?: 'ambiguous' | 'invalid';
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
        class="status-san cursor-pointer pr-28 text-left"
        onClick={scrollPanelToTop}
        type="button"
      >
        {props.lastMoveSan || '-'}
      </button>
      <div class="status-footer-row">
        <div class="flex flex-wrap items-baseline gap-3">
          <span class="status-heard-label">Heard</span>
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
