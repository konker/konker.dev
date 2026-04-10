/* eslint-disable */
import { CornerDownLeft, PanelTopClose, PanelTopOpen, RotateCcw, Settings2 } from 'lucide-solid';
import { type JSX } from 'solid-js';

type TopActionRowProps = {
  readonly onClear: () => void;
  readonly onSubmit: () => void;
  readonly onToggleSecondary: () => void;
  readonly onToggleSettings: () => void;
  readonly settingsVisible: boolean;
  readonly secondaryActive: boolean;
};

export function TopActionRow(props: TopActionRowProps): JSX.Element {
  return (
    <div
      class="chess-keyboard-row"
      data-row="row-1"
      data-settings-visible={props.settingsVisible}
      data-slot="top-action-row"
    >
      <button
        aria-label={props.secondaryActive ? 'Hide Secondary Keys' : 'Show Secondary Keys'}
        class="chess-keyboard-button"
        data-button-id="toggle-secondary"
        data-button-kind="action"
        data-highlighted="false"
        data-icon-only="true"
        data-slot="button"
        onClick={props.onToggleSecondary}
        type="button"
      >
        {props.secondaryActive ? (
          <PanelTopClose aria-hidden="true" class="chess-keyboard-button-icon" />
        ) : (
          <PanelTopOpen aria-hidden="true" class="chess-keyboard-button-icon" />
        )}
      </button>
      {props.settingsVisible ? (
        <button
          aria-label="Settings"
          class="chess-keyboard-button"
          data-button-id="toggle-settings"
          data-button-kind="action"
          data-highlighted="false"
          data-icon-only="true"
          data-slot="button"
          onClick={props.onToggleSettings}
          type="button"
        >
          <Settings2 aria-hidden="true" class="chess-keyboard-button-icon" />
        </button>
      ) : null}
      <button
        aria-label="Clear"
        class="chess-keyboard-button"
        data-button-id="clear"
        data-button-kind="action"
        data-highlighted="false"
        data-icon-only="true"
        data-slot="button"
        onClick={props.onClear}
        type="button"
      >
        <RotateCcw aria-hidden="true" class="chess-keyboard-button-icon" />
      </button>
      <button
        aria-label="Submit"
        class="chess-keyboard-button"
        data-button-id="submit"
        data-button-kind="action"
        data-highlighted="false"
        data-icon-only="true"
        data-slot="button"
        onClick={props.onSubmit}
        type="button"
      >
        <CornerDownLeft aria-hidden="true" class="chess-keyboard-button-icon" />
      </button>
    </div>
  );
}
