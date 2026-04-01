import { Info } from 'lucide-solid';
import type { JSX } from 'solid-js';

import type { GameModelEvaluateStatus } from '../../../game-model/evaluate';

type StatusPanelProps = {
  readonly controls?: JSX.Element;
  readonly currentPly: number;
  readonly status: GameModelEvaluateStatus;
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

  function renderMoveNumber(): number {
    return Math.max(1, Math.ceil(props.currentPly / 2));
  }

  function renderCurrentMoveColor(): 'White' | 'Black' {
    return props.currentPly % 2 === 0 ? 'White' : 'Black';
  }

  function scrollPanelToTop(): void {
    panelEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section class="status-surface" data-status={props.status} id="status" ref={panelEl}>
      <div class="status-header">
        <span class="status-label">
          <Info class="h-4 w-4" />
          <span>Status</span>
        </span>
        <span aria-label="Last Input Evaluate Status" class="status-chip">
          {renderStatusText()}
        </span>
      </div>
      <button
        aria-label="Last Input SAN"
        class="status-san cursor-pointer text-left"
        onClick={scrollPanelToTop}
        type="button"
      >
        {props.lastMoveSan || 'No move yet'}
      </button>
      <div aria-label="Last Input Message" class="status-message">
        {props.message}
      </div>
      <div class="flex flex-wrap gap-2 text-sm">
        <span class="status-chip">Move {renderMoveNumber()}</span>
        <span class="status-chip">{renderCurrentMoveColor()} to move</span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="status-heard-label">Heard</span>
        <span aria-label="Last Input Sanitized" class="status-heard-value">
          {props.sanitizedInput || 'No input yet'}
        </span>
      </div>

      {props.controls ? <div class="toolbar-group border-t pt-3">{props.controls}</div> : null}
    </section>
  );
}
