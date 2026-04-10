/* eslint-disable */
import { Show, type JSX } from 'solid-js';

import type { KeyboardBehaviorSettings } from '../core/types.js';
import type { ChessKeyboardVisibleSettingsMap } from './types.js';

type SettingsPanelProps = {
  readonly onToggleAutoSubmit: () => void;
  readonly onToggleCandidateBar: () => void;
  readonly onToggleKeyHighlights: () => void;
  readonly onToggleOrientation: () => void;
  readonly onToggleShowReadout: () => void;
  readonly settings: KeyboardBehaviorSettings;
  readonly visibleSettings?: ChessKeyboardVisibleSettingsMap | undefined;
};

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
  return (
    <section class="chess-keyboard-settings" data-slot="settings-panel">
      <div class="chess-keyboard-settings-group" data-slot="settings-group">
        <Show when={props.visibleSettings?.candidateBar !== false}>
          <label class="chess-keyboard-settings-field" data-slot="settings-field">
            <span class="chess-keyboard-settings-label" data-slot="settings-label">
              Candidate Bar
            </span>
            <input
              checked={props.settings.candidateBar}
              class="chess-keyboard-settings-control"
              data-slot="settings-control"
              onChange={() => {
                props.onToggleCandidateBar();
              }}
              type="checkbox"
            />
          </label>
        </Show>
        <Show when={props.visibleSettings?.keyHighlights !== false}>
          <label class="chess-keyboard-settings-field" data-slot="settings-field">
            <span class="chess-keyboard-settings-label" data-slot="settings-label">
              Key Highlights
            </span>
            <input
              checked={props.settings.keyHighlights}
              class="chess-keyboard-settings-control"
              data-slot="settings-control"
              onChange={() => {
                props.onToggleKeyHighlights();
              }}
              type="checkbox"
            />
          </label>
        </Show>
        <Show when={props.visibleSettings?.autoSubmit !== false}>
          <label class="chess-keyboard-settings-field" data-slot="settings-field">
            <span class="chess-keyboard-settings-label" data-slot="settings-label">
              Auto Submit
            </span>
            <input
              checked={props.settings.autoSubmit}
              class="chess-keyboard-settings-control"
              data-slot="settings-control"
              onChange={() => {
                props.onToggleAutoSubmit();
              }}
              type="checkbox"
            />
          </label>
        </Show>
        <Show when={props.visibleSettings?.showReadout !== false}>
          <label class="chess-keyboard-settings-field" data-slot="settings-field">
            <span class="chess-keyboard-settings-label" data-slot="settings-label">
              Show Readout
            </span>
            <input
              checked={props.settings.showReadout}
              class="chess-keyboard-settings-control"
              data-slot="settings-control"
              onChange={() => {
                props.onToggleShowReadout();
              }}
              type="checkbox"
            />
          </label>
        </Show>
      </div>
      <Show when={props.visibleSettings?.orientation !== false}>
        <fieldset class="chess-keyboard-settings-group" data-slot="settings-group">
          <legend class="chess-keyboard-settings-label" data-slot="settings-label">
            Orientation
          </legend>
          <label class="chess-keyboard-settings-field" data-slot="settings-field">
            <span class="chess-keyboard-settings-label" data-slot="settings-label">
              White
            </span>
            <input
              checked={props.settings.orientation === 'white'}
              class="chess-keyboard-settings-control"
              data-slot="settings-control"
              name="keyboard-orientation"
              onChange={() => {
                if (props.settings.orientation !== 'white') {
                  props.onToggleOrientation();
                }
              }}
              type="radio"
            />
          </label>
          <label class="chess-keyboard-settings-field" data-slot="settings-field">
            <span class="chess-keyboard-settings-label" data-slot="settings-label">
              Black
            </span>
            <input
              checked={props.settings.orientation === 'black'}
              class="chess-keyboard-settings-control"
              data-slot="settings-control"
              name="keyboard-orientation"
              onChange={() => {
                if (props.settings.orientation !== 'black') {
                  props.onToggleOrientation();
                }
              }}
              type="radio"
            />
          </label>
        </fieldset>
      </Show>
    </section>
  );
}
