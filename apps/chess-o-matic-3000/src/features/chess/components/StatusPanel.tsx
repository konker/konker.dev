import { Info } from 'lucide-solid';
import type { JSX } from 'solid-js';

import type { GameModelEvaluateStatus } from '../../../game-model/evaluate';

type StatusPanelProps = {
  readonly status: GameModelEvaluateStatus;
  readonly lastMoveSan: string;
  readonly message: string;
  readonly sanitizedInput: string;
};

export function StatusPanel(props: StatusPanelProps): JSX.Element {
  function renderStatusClasses(): string {
    switch (props.status) {
      case 'ok':
        return 'border-l-green-700';
      case 'illegal':
        return 'border-l-red-600';
      case 'control':
        return 'border-l-blue-600';
      case 'ignore':
      default:
        return 'border-l-slate-400';
    }
  }

  return (
    <div
      class={`flex flex-col gap-2 border border-slate-300 border-l-[0.75rem] bg-slate-50 px-4 py-3 ${renderStatusClasses()}`}
      data-status={props.status}
      id="status"
    >
      <div class="flex justify-between gap-4 text-sm text-slate-600">
        <span class="flex items-center gap-2">
          <Info class="h-4 w-4" />
          <span>Status</span>
        </span>
        <span aria-label="Last Input Evaluate Status">{props.status}</span>
      </div>
      <div aria-label="Last Input SAN" class="text-2xl font-bold leading-tight">
        {props.lastMoveSan || 'No move yet'}
      </div>
      <div aria-label="Last Input Message" class="text-base leading-6">
        {props.message}
      </div>
      <div class="flex flex-col gap-1 text-sm text-slate-600">
        <span>Heard</span>
        <span aria-label="Last Input Sanitized">{props.sanitizedInput || 'No input yet'}</span>
      </div>
    </div>
  );
}
