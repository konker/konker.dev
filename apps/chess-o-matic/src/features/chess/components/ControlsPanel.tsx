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
      <button disabled={props.disabled} onClick={props.onToggleListening} type="button">
        {props.isListening ? 'Disable Audio Input' : 'Enable Audio Input'}
      </button>

      <button disabled={props.disabled} onClick={props.onToggleSound} type="button">
        {props.isSoundEnabled ? 'Disable Audio Output' : 'Enable Audio Output'}
      </button>
    </div>
  );
}
