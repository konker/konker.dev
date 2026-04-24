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

The stylesheet no longer loads web fonts for you. If you want the default typography, load these font families in the parent app:

- `Atkinson Hyperlegible Next`
- `Atkinson Hyperlegible Mono`

The component reads them through these CSS variables, so host apps can also point the keyboard at different fonts:

- `--chesskbd-font-ui`
- `--chesskbd-font-mono`

## Usage

```tsx
import { ChessKeyboard } from '@konker.dev/chess-o-matic-keyboard/solid';

export function Example() {
  return (
    <ChessKeyboard
      legalMovesSan={['e4', 'd4', 'Nf3', 'Nc3']}
      allowOmittedXInPieceCaptures
      candidateBar
      keyHighlightsMode="always"
      autoSubmit
      perspective="white"
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
- `showNunnAnnotations?: boolean`

Flat behavior props:

- `allowOmittedXInPieceCaptures?: boolean`
- `autoSubmit?: boolean`
- `candidateBar?: boolean`
- `keyHighlightsMode?: 'off' | 'after-input' | 'always'`
- `perspective?: 'white' | 'black'`
- `showReadout?: boolean`

You can also pass `settings?: Partial<KeyboardBehaviorSettings>`, but the flat props take precedence when both are provided.

You can also pass `visibleSettings?: false | Partial<Record<keyof KeyboardBehaviorSettings, boolean>>` to control which settings are shown in the settings panel. Omitted keys default to visible. Pass `false` to hide the settings button entirely and let the remaining top-row action buttons expand to fill the row.

```tsx
<ChessKeyboard
  visibleSettings={{
    allowOmittedXInPieceCaptures: true,
    autoSubmit: false,
    candidateBar: true,
    keyHighlightsMode: true,
    perspective: false,
    showReadout: true,
  }}
/>
```

Hide the Nunn annotation buttons `!`, `!!`, `!?`, `?`, `??`, `?!` while keeping `+` and `#` available:

```tsx
<ChessKeyboard showNunnAnnotations={false} />
```

When `allowOmittedXInPieceCaptures` is enabled, non-pawn capture suggestions like `Bxf6` also expose `Bf6`. The keyboard submits the omitted-`x` form unchanged, which lets a downstream `chess.js` instance normalize it back to the canonical SAN.

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
