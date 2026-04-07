/* eslint-disable fp/no-nil */
import { createMemo, For, type JSX, Show } from 'solid-js';

import type { KeyboardKeyDefinition, KeyboardKeyId } from '../core/types.js';

type SecondaryPanelProps = {
  readonly highlightedKeyIds: ReadonlySet<KeyboardKeyId>;
  readonly keys: ReadonlyArray<KeyboardKeyDefinition>;
  readonly onPressKey: (keyId: KeyboardKeyId) => void;
  readonly visible: boolean;
};

type SecondaryButton = {
  readonly highlighted: boolean;
  readonly id: KeyboardKeyId;
  readonly label: string;
  readonly onClick: () => void;
};

type SecondaryRow = {
  readonly buttons: ReadonlyArray<SecondaryButton>;
  readonly id: string;
};

const SECONDARY_ROW_1: ReadonlyArray<KeyboardKeyId> = ['castle-kingside', 'castle-queenside'];
const SECONDARY_ROW_2: ReadonlyArray<KeyboardKeyId> = [
  'annotation-check',
  'annotation-checkmate',
  'promotion-equals',
  'coordinate-separator',
];
const SECONDARY_ROW_3: ReadonlyArray<KeyboardKeyId> = [
  'annotation-good',
  'annotation-brilliant',
  'annotation-interesting',
  'annotation-blunder',
  'annotation-mistake',
  'annotation-dubious',
];

export function SecondaryPanel(props: SecondaryPanelProps): JSX.Element {
  const rows = createMemo<ReadonlyArray<SecondaryRow>>(() => {
    const keyMap = new Map(props.keys.map((key) => [key.id, key]));

    return [
      {
        id: 'secondary-row-1',
        buttons: SECONDARY_ROW_1.map((keyId) =>
          secondaryButton(keyId, keyMap, props.highlightedKeyIds, props.onPressKey)
        ),
      },
      {
        id: 'secondary-row-2',
        buttons: SECONDARY_ROW_2.map((keyId) =>
          secondaryButton(keyId, keyMap, props.highlightedKeyIds, props.onPressKey)
        ),
      },
      {
        id: 'secondary-row-3',
        buttons: SECONDARY_ROW_3.map((keyId) =>
          secondaryButton(keyId, keyMap, props.highlightedKeyIds, props.onPressKey)
        ),
      },
    ];
  });

  return (
    <Show when={props.visible}>
      <section class="chess-keyboard-secondary-panel" data-slot="secondary-panel">
        <For each={rows()}>
          {(row) => (
            <div class="chess-keyboard-secondary-row chess-keyboard-row" data-row={row.id} data-slot="secondary-row">
              <For each={row.buttons}>
                {(button) => (
                  <button
                    class="chess-keyboard-button"
                    data-button-id={button.id}
                    data-button-kind="secondary"
                    data-highlighted={button.highlighted}
                    data-slot="button"
                    onClick={() => {
                      button.onClick();
                    }}
                    type="button"
                  >
                    {button.label}
                  </button>
                )}
              </For>
            </div>
          )}
        </For>
      </section>
    </Show>
  );
}

function secondaryButton(
  keyId: KeyboardKeyId,
  keyMap: ReadonlyMap<KeyboardKeyId, KeyboardKeyDefinition>,
  highlightedKeyIds: ReadonlySet<KeyboardKeyId>,
  onPressKey: (keyId: KeyboardKeyId) => void
): SecondaryButton {
  const key = keyMap.get(keyId);

  return {
    highlighted: highlightedKeyIds.has(keyId),
    id: keyId,
    label: key?.label ?? keyId,
    onClick: () => {
      onPressKey(keyId);
    },
  };
}
