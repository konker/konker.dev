import { Mic, MicOff, Volume2, VolumeX } from 'lucide-solid';
import type { JSX } from 'solid-js';

type ControlsPanelProps = {
  readonly disabled: boolean;
  readonly isListening: boolean;
  readonly isSoundEnabled: boolean;
  readonly onToggleListening: () => void;
  readonly onToggleSound: () => void;
};

export function ControlsPanel(props: ControlsPanelProps): JSX.Element {
  return (
    <div class="flex flex-wrap gap-3">
      <button class="flex items-center gap-2" disabled={props.disabled} onClick={props.onToggleListening} type="button">
        {props.isListening ? <Mic class="h-4 w-4" /> : <MicOff class="h-4 w-4" />}
        <span>Speech</span>
      </button>

      <button class="flex items-center gap-2" disabled={props.disabled} onClick={props.onToggleSound} type="button">
        {props.isSoundEnabled ? <Volume2 class="h-4 w-4" /> : <VolumeX class="h-4 w-4" />}
        <span>Sounds</span>
      </button>
    </div>
  );
}
