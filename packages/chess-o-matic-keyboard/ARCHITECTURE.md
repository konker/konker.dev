# Chess-o-matic Keyboard Architecture

## Overview

`@konker.dev/chess-o-matic-keyboard` should be implemented as a package with a framework-agnostic headless TypeScript core and a SolidJS UI layer.

The first consumer is a SolidJS application that will later be wrapped in Tauri v2 for mobile app store distribution. Given that target, a Solid-first UI is the most practical initial implementation. A custom web component can be added later if a real non-Solid consumer appears.

This architecture keeps the expensive and reusable part of the problem, chess-aware move-entry logic, separate from the rendering layer, while avoiding premature abstraction in the UI layer.

## Goals

- Optimize move entry for mobile and tablet form factors.
- Support chess-aware UX when board state is available.
- Remain usable in a board-agnostic mode when only notation input is needed.
- Keep the core reusable across future UI implementations.
- Fit existing monorepo conventions for strict TypeScript, ESLint, Vitest, and package scripts.

## Non-Goals

- Building a web component in the first version.
- Supporting multiple frontend frameworks in the first version.
- Replacing the application's chess engine.
- Finalizing visual design in this package before the interaction model is stable.

## Architecture Summary

The package should be split into two main layers:

1. `core`
   - Pure TypeScript.
   - No DOM access.
   - No SolidJS dependency.
   - Owns notation-entry state, candidate generation, legal-move filtering, token normalization, promotion handling, and board-aware key enablement.

2. `solid`
   - SolidJS components and integration helpers.
   - Renders the keyboard and related subcomponents.
   - Handles touch interactions, layout variants, accessibility, and responsive behavior.
   - Delegates all chess-aware behavior to `core`.

## Why Not a Web Component First

A web component is still a valid future addition, but it is not the best first UI layer for this package.

Reasons:

- The first real consumer is already SolidJS.
- Tauri v2 mobile still renders a web frontend inside a webview, so Solid components are a natural fit.
- Custom elements introduce extra complexity around lifecycle, events, props vs attributes, typing, and hydration.
- That complexity is not justified until there is an actual non-Solid consumer.

The reusable boundary should be the move-entry engine, not the DOM wrapper.

## Mobile and Tablet First Principles

The package is primarily intended for phone and tablet usage. That should shape the implementation from the start.

Key implications:

- Large touch targets.
  - Aim for at least 44px, and likely 48px to 56px for high-frequency keys.
- Thumb-friendly layout.
  - Put common notation keys in the most reachable zones.
  - Keep destructive actions deliberate but easy to reach.
- Low-friction correction.
  - Clear, clear-token, clear-all, and candidate replacement should be fast.
- Board-aware assistance.
  - When legal move context is available, disable impossible next actions and surface likely completions early.
- Separate phone and tablet layouts.
  - Tablet should not just be a stretched phone layout.
- Minimal reliance on the native keyboard.
  - The component should work without invoking OS text input for normal move entry.

## Core Responsibilities

The headless core should own the keyboard interaction model and chess-aware logic.

Recommended responsibilities:

- Maintain current input state.
- Represent the partial move being assembled.
- Normalize input tokens.
- Generate candidate SAN strings.
- Track whether a move is complete, incomplete, or invalid.
- Understand promotion state.
- Accept optional chess context and use it to constrain or rank inputs.
- Expose actions for key presses and correction flows.

The core should not:

- Render HTML.
- Depend on browser APIs.
- Depend on SolidJS.
- Depend directly on Tauri APIs.

## Core Operating Modes

The core should support two modes:

1. Notation-only mode
   - No board context is provided.
   - The core performs syntax-oriented assistance only.
   - Useful for raw move entry or incomplete contexts.

2. Board-aware mode
   - Current board state or legal move data is provided.
   - The core can disable impossible next inputs.
   - The core can rank or collapse candidates based on legality.
   - The core can guide promotions, castling, captures, checks, and ambiguous piece moves more effectively.

This should be implemented as one core engine with optional context, not as two separate systems.

## Core Public API Direction

The public API should be explicit and serializable where practical.

Suggested shapes:

```ts
export type KeyboardContext = {
  readonly fen?: string;
  readonly orientation?: 'white' | 'black';
  readonly legalMovesSan?: readonly string[];
  readonly legalMovesUci?: readonly string[];
  readonly inCheck?: boolean;
  readonly turn?: 'w' | 'b';
};

export type KeyboardState = {
  readonly mode: 'notation-only' | 'board-aware';
  readonly rawInput: string;
  readonly normalizedInput: string;
  readonly tokens: readonly string[];
  readonly candidates: readonly string[];
  readonly enabledKeys: ReadonlySet<string>;
  readonly pendingPromotion: boolean;
  readonly canSubmit: boolean;
  readonly status: 'idle' | 'building' | 'complete' | 'invalid';
};

export type KeyboardController = {
  readonly getState: () => KeyboardState;
  readonly pressKey: (key: string) => KeyboardState;
  readonly clear: () => KeyboardState;
  readonly clearToken: () => KeyboardState;
  readonly selectCandidate: (candidate: string) => KeyboardState;
  readonly submit: () => KeyboardSubmitResult;
  readonly setContext: (context?: KeyboardContext) => KeyboardState;
  readonly reset: () => KeyboardState;
};
```

The exact types can evolve, but the intent should remain:

- input and correction are action-based
- state is queryable
- board context is optional
- framework integration does not leak into the core

## Chess Engine Integration

The core should not require a `chess.js` instance as its primary interface.

Instead, it should work against normalized data such as:

- FEN
- turn
- legal moves in SAN and/or UCI form
- optional flags like check state

This keeps the package decoupled from one engine and easier to reuse.

Because the current app already uses `chess.js`, the parent app can translate engine state into `legalMovesSan` directly.

## Solid UI Responsibilities

The Solid layer should be a thin but production-ready rendering and interaction layer.

Responsibilities:

- Render key clusters and candidate bars.
- Render notation preview and editing affordances.
- Adapt layout for phone and tablet.
- Handle touch and pointer interactions.
- Provide accessibility semantics appropriate for a soft keyboard.
- Bridge UI events into core actions.
- Translate core state into visual states.

The Solid layer should not contain chess rules logic beyond presentation-specific concerns.

## Solid API Direction

The Solid API should be ergonomic for app usage, but avoid burying important state inside opaque components.

Suggested exports:

- `ChessKeyboard`
- `CandidateBar`
- `SanReadout`
- `createChessKeyboardController`
- `useChessKeyboard`

Suggested usage direction:

```tsx
<ChessKeyboard
  legalMovesSan={legalMovesSan}
  onChange={(input) => {
    // track permissive user input
  }}
  onSubmit={(input, meta) => {
    // parent app decides whether and how to apply the move
  }}
/>
```

The direct component props are now the primary integration path. `createChessKeyboardController` remains useful for lower-level integrations, but it is no longer the center of the component API.

## State Ownership

The package should support two integration styles:

1. Internal state ownership
   - `ChessKeyboard` manages input and settings internally.
   - Good for simple usage and demo flows.

2. External value/settings ownership
   - Consumer app controls `value` and/or `settings`.
   - Good when keyboard state needs to be synchronized with surrounding application state.
   - Better for synchronization with board state, game state, persistence, analytics, or custom flows.

For the chess app, external ownership is likely the better long-term default.

## Tauri v2 Considerations

This architecture remains suitable when the Solid app is wrapped in Tauri v2.

Important considerations:

- Avoid depending on native text input for core move entry.
- Be careful with focus management so the OS keyboard does not appear unexpectedly.
- Handle viewport changes and safe areas well.
- Keep interactions responsive in mobile webviews.
- Ensure no part of the keyboard requires browser features that are unreliable in embedded mobile webviews.

Nothing about Tauri requires a web component. A Solid-based UI inside a webview is a normal and appropriate model.

## Package Structure

Recommended initial structure:

```text
packages/chess-o-matic-keyboard/
  ARCHITECTURE.md
  package.json
  tsconfig.json
  eslint.config.mjs
  vitest.config.ts
  README.md
  LICENSE
  src/
    index.ts
    core/
      index.ts
      types.ts
      controller.ts
      state.ts
      normalizer.ts
      candidates.ts
      context.ts
    solid/
      index.ts
      ChessKeyboard.tsx
      CandidateBar.tsx
      SanReadout.tsx
      KeyGrid.tsx
      SettingsPanel.tsx
      createChessKeyboardController.ts
    test/
      setup.ts
```

## Export Strategy

Prefer explicit subpath exports.

Recommended export groups:

- `@konker.dev/chess-o-matic-keyboard`
- `@konker.dev/chess-o-matic-keyboard/core`
- `@konker.dev/chess-o-matic-keyboard/solid`

This allows consumers to depend only on what they need.

## Monorepo Conventions

The package should follow the same general conventions as the existing packages in the monorepo.

Conventions to keep:

- strict TypeScript
- shared ESLint base config
- Vitest for tests
- the standard package script set
- explicit exports
- generated `dist/` output

Important adjustment:

The shared TypeScript base is Node-oriented by default, so this package should override compiler options for a browser-facing library. In particular:

- include `DOM` libraries
- use JSX settings appropriate for Solid
- use bundler-friendly module resolution if needed for the Solid layer

The ESLint config should extend the shared base, but disable rules that are impractical for UI code where necessary, such as:

- `fp/no-class` if any class-like UI helper is introduced
- `fp/no-mutation`
- `fp/no-mutating-methods`
- `fp/no-let`

These should be relaxed narrowly and intentionally, not globally without review.

## Testing Strategy

Testing should be split by layer.

Core tests:

- tokenization
- normalization
- candidate generation
- enabled key derivation
- board-aware filtering
- promotions
- correction flows
- invalid and incomplete states

Solid tests:

- rendering of enabled and disabled states
- candidate bar behavior
- submit and correction interactions
- responsive variant switching where practical
- touch and pointer interaction behavior

The majority of behavioral correctness should be proven in core tests.

## Evolution Path

Recommended implementation order:

1. Establish core types and controller.
2. Implement notation-only mode.
3. Add board-aware context support.
4. Build Solid keyboard UI against the controller.
5. Tune layout and interaction model for mobile and tablet usage.
6. Keep engine integration at the parent-app boundary unless a concrete adapter earns its maintenance cost.
7. Reassess whether a web component is justified by actual consumers.

If a non-Solid consumer appears later, a web component can be built on top of the same core without undoing this design.

## Decision

The package will be built as:

- a headless TypeScript chess move-entry core
- a SolidJS UI implementation for the first version
- optional future adapters and possibly a future web component layer if reuse demands it

This is the lowest-complexity architecture that still preserves the right reusable boundary.
