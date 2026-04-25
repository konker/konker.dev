import { Mic, MicOff, Volume2, VolumeX } from 'lucide-solid';
import type { JSX } from 'solid-js';

type ControlsPanelProps = {
  readonly disabled: boolean;
  readonly isGameOver: boolean;
  readonly isListeningAvailable: boolean;
  readonly isListening: boolean;
  readonly isSoundAvailable: boolean;
  readonly isSoundEnabled: boolean;
  readonly onToggleListening: () => void;
  readonly onToggleSound: () => void;
};

export function ControlsPanel(props: ControlsPanelProps): JSX.Element {
  return (
    <div class="toolbar-group" role="group" aria-label="Speech and sound controls">
      <button
        aria-label="Speech"
        class={`toolbar-icon-button toolbar-icon-button-cobalt ${props.isListening ? 'toolbar-button-active' : ''}`}
        disabled={props.disabled || props.isGameOver || !props.isListeningAvailable}
        onClick={props.onToggleListening}
        title="Speech"
        type="button"
      >
        {props.isListening ? <Mic class="h-4 w-4" /> : <MicOff class="h-4 w-4" />}
      </button>

      <button
        aria-label="Sounds"
        class={`toolbar-icon-button toolbar-icon-button-cobalt ${props.isSoundEnabled ? 'toolbar-button-active' : ''}`}
        disabled={props.disabled || !props.isSoundAvailable}
        onClick={props.onToggleSound}
        title="Sounds"
        type="button"
      >
        {props.isSoundEnabled ? <Volume2 class="h-4 w-4" /> : <VolumeX class="h-4 w-4" />}
      </button>
    </div>
  );
}
