/* eslint-disable */
import { Show, type JSX } from 'solid-js';

import type { KeyboardBehaviorSettings, KeyboardHighlightsMode } from '../core/types.js';
import type { ChessKeyboardVisibleSettingsMap } from './types.js';

type SettingsPanelProps = {
  readonly onToggleAutoSubmit: () => void;
  readonly onToggleCandidateBar: () => void;
  readonly onSetKeyHighlightsMode: (mode: KeyboardHighlightsMode) => void;
  readonly onToggleOrientation: () => void;
  readonly onToggleShowReadout: () => void;
  readonly settings: KeyboardBehaviorSettings;
  readonly visibleSettings?: ChessKeyboardVisibleSettingsMap | undefined;
};

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
  return (
    <section class="chess-keyboard-settings" data-slot="settings-panel">
      <div class="chess-keyboard-settings-group" data-slot="settings-group">
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
        <Show when={props.visibleSettings?.candidateBar !== false}>
          <label class="chess-keyboard-settings-field" data-slot="settings-field">
            <span class="chess-keyboard-settings-label" data-slot="settings-label">
              Show Candidate Bar
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
        <Show when={props.visibleSettings?.keyHighlightsMode !== false}>
          <fieldset class="chess-keyboard-settings-group" data-slot="settings-group">
            <legend class="chess-keyboard-settings-label" data-slot="settings-label">
              Key Highlights
            </legend>
            <label class="chess-keyboard-settings-field" data-slot="settings-field">
              <span class="chess-keyboard-settings-label" data-slot="settings-label">
                Off
              </span>
              <input
                checked={props.settings.keyHighlightsMode === 'off'}
                class="chess-keyboard-settings-control"
                data-slot="settings-control"
                name="keyboard-key-highlights-mode"
                onChange={() => {
                  if (props.settings.keyHighlightsMode !== 'off') {
                    props.onSetKeyHighlightsMode('off');
                  }
                }}
                type="radio"
              />
            </label>
            <label class="chess-keyboard-settings-field" data-slot="settings-field">
              <span class="chess-keyboard-settings-label" data-slot="settings-label">
                After Input
              </span>
              <input
                checked={props.settings.keyHighlightsMode === 'after-input'}
                class="chess-keyboard-settings-control"
                data-slot="settings-control"
                name="keyboard-key-highlights-mode"
                onChange={() => {
                  if (props.settings.keyHighlightsMode !== 'after-input') {
                    props.onSetKeyHighlightsMode('after-input');
                  }
                }}
                type="radio"
              />
            </label>
            <label class="chess-keyboard-settings-field" data-slot="settings-field">
              <span class="chess-keyboard-settings-label" data-slot="settings-label">
                Always
              </span>
              <input
                checked={props.settings.keyHighlightsMode === 'always'}
                class="chess-keyboard-settings-control"
                data-slot="settings-control"
                name="keyboard-key-highlights-mode"
                onChange={() => {
                  if (props.settings.keyHighlightsMode !== 'always') {
                    props.onSetKeyHighlightsMode('always');
                  }
                }}
                type="radio"
              />
            </label>
          </fieldset>
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
