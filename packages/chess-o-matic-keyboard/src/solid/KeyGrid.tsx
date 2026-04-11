/* eslint-disable fp/no-nil */
import { X } from 'lucide-solid';
import { createMemo, For, type JSX } from 'solid-js';

import type { KeyboardKeyDefinition, KeyboardKeyId, KeyboardOrientation } from '../core/types.js';

type KeyGridProps = {
  readonly highlightedKeyIds: ReadonlySet<KeyboardKeyId>;
  readonly keys: ReadonlyArray<KeyboardKeyDefinition>;
  readonly onPressKey: (keyId: KeyboardKeyId) => void;
  readonly orientation: KeyboardOrientation;
  readonly trailedKeyIds: ReadonlySet<KeyboardKeyId>;
};

type GridButton = {
  readonly ariaLabel?: string;
  readonly kind: 'action' | 'piece' | 'file' | 'rank' | 'takes' | 'secondary';
  readonly highlighted: boolean;
  readonly icon?: JSX.Element;
  readonly id: string;
  readonly label: string;
  readonly onClick: () => void;
  readonly trailed: boolean;
};

type GridRow = {
  readonly buttons: ReadonlyArray<GridButton>;
  readonly id: string;
};

const PRIMARY_ROW_1: ReadonlyArray<KeyboardKeyId> = [
  'piece-knight',
  'piece-bishop',
  'piece-rook',
  'piece-queen',
  'piece-king',
];
const FILE_KEYS_WHITE: ReadonlyArray<KeyboardKeyId> = [
  'file-a',
  'file-b',
  'file-c',
  'file-d',
  'file-e',
  'file-f',
  'file-g',
  'file-h',
];
const FILE_KEYS_BLACK: ReadonlyArray<KeyboardKeyId> = [...FILE_KEYS_WHITE].reverse();
const RANK_KEYS_WHITE: ReadonlyArray<KeyboardKeyId> = [
  'rank-1',
  'rank-2',
  'rank-3',
  'rank-4',
  'rank-5',
  'rank-6',
  'rank-7',
  'rank-8',
];
const RANK_KEYS_BLACK: ReadonlyArray<KeyboardKeyId> = [...RANK_KEYS_WHITE].reverse();
export function KeyGrid(props: KeyGridProps): JSX.Element {
  const rows = createMemo<ReadonlyArray<GridRow>>(() => {
    const keyMap = new Map(props.keys.map((key) => [key.id, key]));
    const fileKeys = props.orientation === 'black' ? FILE_KEYS_BLACK : FILE_KEYS_WHITE;
    const rankKeys = props.orientation === 'black' ? RANK_KEYS_BLACK : RANK_KEYS_WHITE;
    const nextRows: Array<GridRow> = [
      {
        id: 'row-2',
        buttons: PRIMARY_ROW_1.map((keyId) =>
          notationButton(keyId, 'piece', keyMap, props.highlightedKeyIds, props.onPressKey, props.trailedKeyIds)
        ),
      },
      {
        id: 'row-3',
        buttons: [
          notationButton(
            'capture',
            'takes',
            keyMap,
            props.highlightedKeyIds,
            props.onPressKey,
            props.trailedKeyIds,
            undefined,
            {
              ariaLabel: 'Capture',
              icon: <X aria-hidden="true" class="chess-keyboard-button-icon" />,
            }
          ),
        ],
      },
      {
        id: 'row-4',
        buttons: fileKeys.map((keyId) =>
          notationButton(keyId, 'file', keyMap, props.highlightedKeyIds, props.onPressKey, props.trailedKeyIds)
        ),
      },
      {
        id: 'row-5',
        buttons: rankKeys.map((keyId) =>
          notationButton(keyId, 'rank', keyMap, props.highlightedKeyIds, props.onPressKey, props.trailedKeyIds)
        ),
      },
    ];

    return nextRows;
  });

  return (
    <div class="chess-keyboard-grid" data-slot="grid">
      <For each={rows()}>
        {(row) => (
          <div class="chess-keyboard-row" data-row={row.id} data-slot="row">
            <For each={row.buttons}>
              {(button) => (
                <button
                  class="chess-keyboard-button"
                  data-button-kind={button.kind}
                  data-button-id={button.id}
                  data-icon-only={button.icon === undefined ? 'false' : 'true'}
                  data-highlighted={button.highlighted}
                  data-slot="button"
                  data-trailed={button.trailed}
                  aria-label={button.ariaLabel}
                  onClick={() => {
                    button.onClick();
                  }}
                  type="button"
                >
                  {button.icon ?? button.label}
                </button>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}

function notationButton(
  keyId: KeyboardKeyId,
  kind: GridButton['kind'],
  keyMap: ReadonlyMap<KeyboardKeyId, KeyboardKeyDefinition>,
  highlightedKeyIds: ReadonlySet<KeyboardKeyId>,
  onPressKey: (keyId: KeyboardKeyId) => void,
  trailedKeyIds: ReadonlySet<KeyboardKeyId>,
  labelOverride?: string,
  options?: {
    readonly ariaLabel?: string;
    readonly icon?: JSX.Element;
  }
): GridButton {
  const key = keyMap.get(keyId);

  return {
    ...(options?.ariaLabel === undefined ? {} : { ariaLabel: options.ariaLabel }),
    kind,
    highlighted: highlightedKeyIds.has(keyId),
    ...(options?.icon === undefined ? {} : { icon: options.icon }),
    id: keyId,
    label: labelOverride ?? key?.label ?? keyId,
    onClick: () => {
      onPressKey(keyId);
    },
    trailed: trailedKeyIds.has(keyId),
  };
}
