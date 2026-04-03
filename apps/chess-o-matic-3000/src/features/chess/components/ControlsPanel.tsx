import { Mic, MicOff, Volume2, VolumeX } from 'lucide-solid';
import type { JSX } from 'solid-js';

type ControlsPanelProps = {
  readonly disabled: boolean;
  readonly isListeningAvailable: boolean;
  readonly isListening: boolean;
  readonly isSoundAvailable: boolean;
  readonly isSoundEnabled: boolean;
  readonly onToggleListening: () => void;
  readonly onToggleSound: () => void;
};

export function ControlsPanel(props: ControlsPanelProps): JSX.Element {
  return (
    <div class="toolbar-group">
      <button
        class={`toolbar-button toolbar-button-cobalt ${props.isListening ? 'toolbar-button-active' : ''}`}
        disabled={props.disabled || !props.isListeningAvailable}
        onClick={props.onToggleListening}
        type="button"
      >
        {props.isListening ? <Mic class="h-4 w-4" /> : <MicOff class="h-4 w-4" />}
        <span>Speech</span>
      </button>

      <button
        class={`toolbar-button toolbar-button-cobalt ${props.isSoundEnabled ? 'toolbar-button-active' : ''}`}
        disabled={props.disabled || !props.isSoundAvailable}
        onClick={props.onToggleSound}
        type="button"
      >
        {props.isSoundEnabled ? <Volume2 class="h-4 w-4" /> : <VolumeX class="h-4 w-4" />}
        <span>Sounds</span>
      </button>
    </div>
  );
}
