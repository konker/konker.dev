import type { JSX } from 'solid-js';

import type { GameModelEvaluateStatus } from '../../../game-model/evaluate';

type StatusPanelProps = {
  readonly controls?: JSX.Element;
  readonly status: GameModelEvaluateStatus;
  readonly illegalReason?: 'ambiguous' | 'invalid';
  readonly lastMoveSan: string;
  readonly message: string;
  readonly sanitizedInput: string;
};

export function StatusPanel(props: StatusPanelProps): JSX.Element {
  let panelEl: HTMLElement | undefined;

  function renderStatusText(): string {
    switch (props.status) {
      case 'ok':
        return 'Move accepted';
      case 'illegal':
        return 'Illegal move';
      case 'control':
        return 'Command received';
      case 'ignore':
      default:
        return 'Waiting';
    }
  }

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
    panelEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section
      class="status-surface"
      data-illegal-reason={props.status === 'illegal' ? props.illegalReason : undefined}
      data-status={props.status}
      id="status"
      ref={panelEl}
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
      <div class="flex flex-wrap items-baseline gap-3">
        <span class="status-heard-label">Heard</span>
        <span aria-label="Last Input Sanitized" class="status-heard-value">
          {props.sanitizedInput || 'No input yet'}
        </span>
      </div>

      {props.controls ? <div class="toolbar-group border-t pt-3">{props.controls}</div> : null}
    </section>
  );
}
