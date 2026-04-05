/* eslint-disable fp/no-nil */
import { createMemo, createSignal, For, type JSX, Show } from "solid-js";

import {
  KEYBOARD_KEYS,
  type KeyboardController,
  type KeyboardKeyDefinition,
} from "../core/types.js";

export type ChessKeyboardProps = {
  readonly class?: string;
  readonly controller: KeyboardController;
  readonly onSubmit?: (candidate: string) => void;
};

export function ChessKeyboard(props: ChessKeyboardProps): JSX.Element {
  const [state, setState] = createSignal(props.controller.getState());

  const visibleKeys = createMemo<ReadonlyArray<KeyboardKeyDefinition>>(() =>
    KEYBOARD_KEYS.filter(
      (key) =>
        key.kind === "notation" &&
        key.screenStates.some(
          (screenState) => screenState === state().screenState,
        ),
    ),
  );

  function handleKeyPress(keyId: KeyboardKeyDefinition["id"]): void {
    setState(props.controller.pressKey(keyId));
  }

  function handleSubmit(): void {
    const result = props.controller.submit();

    if (result.ok) {
      setState(result.state);
      props.onSubmit?.(result.candidate.san);
    }
  }

  return (
    <section
      class={props.class}
      data-mode={state().mode}
      data-screen-state={state().screenState}
      data-status={state().status}
    >
      <output>{state().normalizedInput}</output>
      <div>
        <For each={visibleKeys()}>
          {(key) => (
            <button
              disabled={!state().enabledKeys.has(key.id)}
              onClick={() => handleKeyPress(key.id)}
              type="button"
            >
              {key.label}
            </button>
          )}
        </For>
      </div>
      <div>
        <button
          onClick={() => {
            setState(props.controller.toggleSecondary());
          }}
          type="button"
        >
          {state().screenState === "secondary" ? "Primary" : "More"}
        </button>
        <button
          onClick={() => {
            setState(props.controller.backspace());
          }}
          type="button"
        >
          Backspace
        </button>
        <button
          onClick={() => {
            setState(props.controller.clearToken());
          }}
          type="button"
        >
          Clear Token
        </button>
        <button
          onClick={() => {
            setState(props.controller.clear());
          }}
          type="button"
        >
          Clear
        </button>
        <button
          disabled={!state().canSubmit}
          onClick={handleSubmit}
          type="button"
        >
          Submit
        </button>
      </div>
      <Show when={state().candidates.length > 0}>
        <ul>
          <For each={state().candidates}>
            {(candidate) => (
              <li>
                <button
                  onClick={() => {
                    setState(props.controller.selectCandidate(candidate.id));
                  }}
                  type="button"
                >
                  {candidate.san}
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
}
