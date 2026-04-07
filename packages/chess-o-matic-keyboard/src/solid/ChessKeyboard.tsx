/* eslint-disable fp/no-nil */
import { createEffect, createMemo, createSignal, type JSX, Show, untrack } from 'solid-js';

import type { KeyboardBehaviorSettings, KeyboardKeyDefinition, KeyboardSubmitEvent } from '../core/types.js';
import { DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS, KEYBOARD_KEYS } from '../core/types.js';
import { CandidateBar } from './CandidateBar.js';
import { createChessKeyboardController } from './createChessKeyboardController.js';
import { KeyGrid } from './KeyGrid.js';
import { SanReadout } from './SanReadout.js';
import { SecondaryPanel } from './SecondaryPanel.js';
import { SettingsPanel } from './SettingsPanel.js';

export type ChessKeyboardProps = {
  readonly autoSubmit?: boolean;
  readonly candidateBar?: boolean;
  readonly class?: string;
  readonly defaultValue?: string;
  readonly defaultSettings?: Partial<KeyboardBehaviorSettings>;
  readonly keyHighlights?: boolean;
  readonly legalMovesSan?: ReadonlyArray<string>;
  readonly onChange?: (input: string) => void;
  readonly onSettingsChange?: (settings: KeyboardBehaviorSettings) => void;
  readonly onSubmit?: (input: string, meta: KeyboardSubmitEvent) => void;
  readonly orientation?: KeyboardBehaviorSettings['orientation'];
  readonly settings?: Partial<KeyboardBehaviorSettings>;
  readonly showReadout?: boolean;
  readonly value?: string;
};

export function ChessKeyboard(props: ChessKeyboardProps): JSX.Element {
  const keyboard = createChessKeyboardController();
  const [initializedDefaultValue, setInitializedDefaultValue] = createSignal(false);
  const [internalSettings, setInternalSettings] = createSignal<KeyboardBehaviorSettings>({
    ...DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS,
    ...props.defaultSettings,
  });
  const [lastAutoSubmitKey, setLastAutoSubmitKey] = createSignal<string | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const hasControlledSettingsProps = createMemo(
    () =>
      props.settings !== undefined ||
      props.autoSubmit !== undefined ||
      props.candidateBar !== undefined ||
      props.keyHighlights !== undefined ||
      props.orientation !== undefined ||
      props.showReadout !== undefined
  );

  createEffect(() => {
    const currentLegalMoves = untrack(() => keyboard.getModel().context?.legalMovesSan);

    if (areStringListsEqual(currentLegalMoves, props.legalMovesSan)) {
      return;
    }

    keyboard.setContext(props.legalMovesSan === undefined ? undefined : { legalMovesSan: props.legalMovesSan });
  });

  createEffect(() => {
    if (
      areSettingsEqual(
        untrack(() => keyboard.getState().settings),
        resolvedSettings()
      )
    ) {
      return;
    }

    keyboard.setSettings(resolvedSettings());
  });

  createEffect(() => {
    if (props.value === undefined || untrack(() => keyboard.getState().input) === props.value) {
      return;
    }

    keyboard.setInput(props.value);
  });

  createEffect(() => {
    if (initializedDefaultValue() || props.defaultValue === undefined || props.value !== undefined) {
      return;
    }

    keyboard.setInput(props.defaultValue);
    setInitializedDefaultValue(true);
  });

  createEffect(() => {
    const currentState = keyboard.state();
    const autoSubmitKey =
      currentState.shouldAutoSubmit && currentState.autoSubmitMatch !== undefined
        ? `${currentState.input}::${currentState.autoSubmitMatch}`
        : undefined;

    if (autoSubmitKey === undefined) {
      setLastAutoSubmitKey(undefined);
      return;
    }

    if (autoSubmitKey === lastAutoSubmitKey()) {
      return;
    }

    setLastAutoSubmitKey(autoSubmitKey);
    submitAndMaybeClear('auto');
  });

  const effectiveLayer = createMemo(() => (keyboard.state().layer === 'secondary' ? 'secondary' : 'primary'));
  const visibleKeys = createMemo<ReadonlyArray<KeyboardKeyDefinition>>(() =>
    KEYBOARD_KEYS.filter((key) => {
      if (key.kind !== 'notation') {
        return false;
      }

      const visibleLayers = effectiveLayer() === 'secondary' ? ['primary', 'secondary'] : ['primary'];

      return key.layers.some((layer) => visibleLayers.includes(layer));
    })
  );
  const secondaryKeys = createMemo<ReadonlyArray<KeyboardKeyDefinition>>(() =>
    KEYBOARD_KEYS.filter((key) => key.kind === 'notation' && key.layers.some((layer) => layer === 'secondary'))
  );
  const resolvedSettings = createMemo<KeyboardBehaviorSettings>(() => ({
    ...internalSettings(),
    ...props.settings,
    ...(props.autoSubmit === undefined ? {} : { autoSubmit: props.autoSubmit }),
    ...(props.candidateBar === undefined ? {} : { candidateBar: props.candidateBar }),
    ...(props.keyHighlights === undefined ? {} : { keyHighlights: props.keyHighlights }),
    ...(props.orientation === undefined ? {} : { orientation: props.orientation }),
    ...(props.showReadout === undefined ? {} : { showReadout: props.showReadout }),
  }));

  const applyInputChange = (nextInput: string) => {
    props.onChange?.(nextInput);
  };

  const applySettingsChange = (nextSettings: KeyboardBehaviorSettings) => {
    if (!hasControlledSettingsProps()) {
      setInternalSettings(nextSettings);
    }

    props.onSettingsChange?.(nextSettings);
  };

  const backspace = () => {
    const nextState = keyboard.backspace();
    applyInputChange(nextState.input);
  };

  const clear = () => {
    const nextState = keyboard.clear();
    applyInputChange(nextState.input);
  };

  const pressKey = (keyId: KeyboardKeyDefinition['id']) => {
    const nextState = keyboard.pressKey(keyId);
    applyInputChange(nextState.input);
  };

  const selectCandidate = (candidate: string) => {
    const autoSubmitKey =
      keyboard.getModel().context?.legalMovesSan?.includes(candidate) === true
        ? `${candidate}::${candidate}`
        : undefined;

    if (autoSubmitKey !== undefined) {
      setLastAutoSubmitKey(autoSubmitKey);
    }

    const nextState = keyboard.selectCandidate(candidate);
    applyInputChange(nextState.input);
    submitAndMaybeClear('candidate');
  };

  const toggleSecondary = () => {
    keyboard.toggleSecondary();
  };

  const toggleSettings = () => {
    setSettingsOpen((open) => !open);
  };

  const toggleBehaviorSetting = (setting: 'autoSubmit' | 'candidateBar' | 'keyHighlights' | 'showReadout') => {
    const nextSettings = {
      ...resolvedSettings(),
      [setting]: !resolvedSettings()[setting],
    };

    applySettingsChange(nextSettings);
  };

  const toggleOrientation = () => {
    applySettingsChange({
      ...resolvedSettings(),
      orientation: resolvedSettings().orientation === 'white' ? 'black' : 'white',
    });
  };

  const handleSubmit = () => {
    submitAndMaybeClear('manual');
  };

  function emitSubmit(event: KeyboardSubmitEvent): void {
    props.onSubmit?.(event.input, event);
  }

  function submitAndMaybeClear(source: KeyboardSubmitEvent['source']): void {
    emitSubmit(keyboard.submit(source));

    if (props.value !== undefined) {
      return;
    }

    const nextState = keyboard.clear();
    applyInputChange(nextState.input);
  }

  return (
    <section
      class={props.class === undefined ? 'chess-keyboard-root' : `chess-keyboard-root ${props.class}`}
      data-layer={keyboard.state().layer}
      data-settings-open={settingsOpen()}
      data-slot="root"
    >
      <Show when={resolvedSettings().showReadout}>
        <SanReadout value={keyboard.state().input} />
      </Show>
      <KeyGrid
        highlightedKeyIds={keyboard.state().highlightedKeyIds}
        keys={visibleKeys()}
        onBackspace={backspace}
        onClear={clear}
        onPressKey={pressKey}
        onSubmit={handleSubmit}
        onToggleSecondary={toggleSecondary}
        onToggleSettings={toggleSettings}
        orientation={resolvedSettings().orientation}
        secondaryActive={effectiveLayer() === 'secondary'}
      />
      <CandidateBar
        candidates={keyboard.state().matchingMoves}
        enabled={resolvedSettings().candidateBar}
        onSelectCandidate={selectCandidate}
        selectedCandidate={keyboard.state().selectedCandidateId}
      />
      <SecondaryPanel
        highlightedKeyIds={keyboard.state().highlightedKeyIds}
        keys={secondaryKeys()}
        onPressKey={pressKey}
        visible={effectiveLayer() === 'secondary'}
      />
      <Show when={settingsOpen()}>
        <SettingsPanel
          onToggleAutoSubmit={() => {
            toggleBehaviorSetting('autoSubmit');
          }}
          onToggleCandidateBar={() => {
            toggleBehaviorSetting('candidateBar');
          }}
          onToggleKeyHighlights={() => {
            toggleBehaviorSetting('keyHighlights');
          }}
          onToggleOrientation={() => {
            toggleOrientation();
          }}
          onToggleShowReadout={() => {
            toggleBehaviorSetting('showReadout');
          }}
          settings={resolvedSettings()}
        />
      </Show>
    </section>
  );
}

function areSettingsEqual(left: KeyboardBehaviorSettings, right: KeyboardBehaviorSettings): boolean {
  return (
    left.autoSubmit === right.autoSubmit &&
    left.candidateBar === right.candidateBar &&
    left.keyHighlights === right.keyHighlights &&
    left.orientation === right.orientation &&
    left.showReadout === right.showReadout
  );
}

function areStringListsEqual(
  left: ReadonlyArray<string> | undefined,
  right: ReadonlyArray<string> | undefined
): boolean {
  if (left === right) {
    return true;
  }

  if (left === undefined || left.length !== right?.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}
