# @konker.dev/chess-o-matic-keyboard

Headless chess move-entry primitives with a SolidJS keyboard UI aimed at mobile and tablet form factors.

## Install

```bash
pnpm add @konker.dev/chess-o-matic-keyboard solid-js
```

Import the packaged stylesheet in your app entry or component boundary:

```ts
import '@konker.dev/chess-o-matic-keyboard/solid/chess-keyboard.css';
```

## Usage

```tsx
import { ChessKeyboard } from '@konker.dev/chess-o-matic-keyboard/solid';

export function Example() {
  return (
    <ChessKeyboard
      legalMovesSan={['e4', 'd4', 'Nf3', 'Nc3']}
      candidateBar
      keyHighlights
      autoSubmit
      orientation="white"
      showReadout
      onSubmit={(input, meta) => {
        console.log(input, meta.source, meta.exactLegalMatch);
      }}
    />
  );
}
```

## Main Props

- `legalMovesSan?: readonly string[]`
- `onChange?: (input: string) => void`
- `onSubmit?: (input: string, meta: KeyboardSubmitEvent) => void`
- `value?: string`
- `defaultValue?: string`
- `defaultSettings?: Partial<KeyboardBehaviorSettings>`

Flat behavior props:

- `autoSubmit?: boolean`
- `candidateBar?: boolean`
- `keyHighlights?: boolean`
- `orientation?: 'white' | 'black'`
- `showReadout?: boolean`

You can also pass `settings?: Partial<KeyboardBehaviorSettings>`, but the flat props take precedence when both are provided.

You can also pass `visibleSettings?: false | Partial<Record<keyof KeyboardBehaviorSettings, boolean>>` to control which settings are shown in the settings panel. Omitted keys default to visible. Pass `false` to hide the settings button entirely and let the remaining top-row action buttons expand to fill the row.

```tsx
<ChessKeyboard
  visibleSettings={{
    autoSubmit: false,
    candidateBar: true,
    keyHighlights: true,
    orientation: false,
    showReadout: true,
  }}
/>
```

## Public Exports

- `@konker.dev/chess-o-matic-keyboard`
- `@konker.dev/chess-o-matic-keyboard/core`
- `@konker.dev/chess-o-matic-keyboard/core/controller`
- `@konker.dev/chess-o-matic-keyboard/core/state`
- `@konker.dev/chess-o-matic-keyboard/core/types`
- `@konker.dev/chess-o-matic-keyboard/solid`
- `@konker.dev/chess-o-matic-keyboard/solid/createChessKeyboardController`
- `@konker.dev/chess-o-matic-keyboard/solid/chess-keyboard.css`

## Notes

- `solid-js` is a peer dependency.
- The package ships ESM and source maps.
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for internals.
