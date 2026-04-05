# Chess-o-matic Keyboard Implementation Plan

## Overview

This document supersedes the earlier guided-state implementation plan.

The keyboard is now being refactored around a simpler contract:

- the keyboard accepts any visible key input the user presses
- the keyboard does not block illegal or invalid SAN input
- legal SAN moves are advisory only
- key visibility changes only when switching layers
- legal-move-derived behavior is limited to:
  - candidate suggestions
  - key highlighting
  - optional auto-submit on a unique exact legal SAN match

The parent application owns move validation and board progression. The keyboard owns only input entry, hint derivation, and optional submission behavior.

## Confirmed Design Decisions

These branches are now considered agreed unless explicitly changed later.

1. Auto-submit only on a unique exact SAN match.
2. Clicking a candidate submits it immediately.
3. The component supports both controlled and uncontrolled usage.
4. Manual submit always emits the current input, even if it is illegal or invalid.
5. Key highlighting means: highlight keys whose append would preserve at least one legal SAN prefix.
6. Ambiguity and promotion overlays/panels are removed for now.
7. Context is reduced to `legalMovesSan?: readonly string[]`.
8. Candidate bar behavior, key highlighting, and auto-submit behavior must each be individually toggleable on/off.
9. These toggles are exposed through a lightweight settings layer in the component.

## Progress Snapshot

As of 2026-04-06:

- Phase 1 is complete.
- Phase 2 is complete.
- Phase 3 is complete.
- Phase 4 is substantially complete.
- Phase 5 is complete.
- Phase 6 is in progress.
- Phase 7 is in progress.
- Phase 8 is still pending.

## New Product Model

### Core Principles

- Input is permissive.
- Hints are derived, never enforced.
- Submission is explicit unless unique exact legal SAN triggers auto-submit.
- The keyboard remains useful when `legalMovesSan` is absent.

### Responsibilities

The keyboard package should:

- capture user-entered SAN-like text
- expose edit operations
- derive legal-move hints from `legalMovesSan`
- optionally auto-submit on unique exact matches
- render layers and structural key layout

The keyboard package should not:

- reject illegal input
- disable keys because of legality
- hide or reveal keys because of legality
- own chess engine state
- decide whether a move should actually be played

## Public API Direction

### Core Context

The core context should be simplified to:

```ts
export type KeyboardContext = {
  readonly legalMovesSan?: readonly string[];
};
```

All richer board-state fields should be removed from the primary contract.

### Core State Direction

The headless state should move toward:

```ts
export type KeyboardLayer = 'primary' | 'alt' | 'settings';

export type KeyboardState = {
  readonly input: string;
  readonly layer: KeyboardLayer;
  readonly legalMovesSan: readonly string[];
  readonly matchingMoves: readonly string[];
  readonly exactMatches: readonly string[];
  readonly highlightedKeyIds: ReadonlySet<KeyboardKeyId>;
  readonly settings: KeyboardBehaviorSettings;
  readonly shouldAutoSubmit: boolean;
};
```

The exact shape may vary, but the important change is:

- no blocking state machine
- no pending ambiguity or promotion state
- no enabled-key derivation
- no key legality gating

### Settings Direction

The behavior toggles should be modeled explicitly:

```ts
export type KeyboardBehaviorSettings = {
  readonly autoSubmit: boolean;
  readonly candidateBar: boolean;
  readonly keyHighlights: boolean;
};
```

Recommended defaults:

- `autoSubmit: true`
- `candidateBar: true`
- `keyHighlights: true`

### Component API Direction

The Solid component should support both controlled and uncontrolled use.

Recommended shape:

```ts
export type ChessKeyboardProps = {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly legalMovesSan?: readonly string[];
  readonly settings?: Partial<KeyboardBehaviorSettings>;
  readonly onChange?: (input: string) => void;
  readonly onSubmit?: (
    input: string,
    meta: {
      readonly source: 'manual' | 'auto' | 'candidate';
      readonly exactLegalMatch?: string;
    }
  ) => void;
};
```

The old controller wrapper can remain as compatibility scaffolding during the migration, but it should stop being the primary design center.

Current component direction:

```ts
export type ChessKeyboardProps = {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly settings?: Partial<KeyboardBehaviorSettings>;
  readonly defaultSettings?: Partial<KeyboardBehaviorSettings>;
  readonly legalMovesSan?: readonly string[];
  readonly onChange?: (input: string) => void;
  readonly onSettingsChange?: (settings: KeyboardBehaviorSettings) => void;
  readonly onSubmit?: (
    input: string,
    meta: {
      readonly source: 'manual' | 'auto' | 'candidate';
      readonly exactLegalMatch?: string;
    }
  ) => void;
};
```

## Migration Strategy

This refactor should be treated as a controlled rewrite of the current behavior model.

### What Will Be Removed

- legality-based key enabling/disabling
- legality-based key hiding/showing within a layer
- ambiguity state
- promotion state
- board-aware context richer than `legalMovesSan`
- pending ambiguity/promotion request modeling
- legality-driven overlays as core interaction mechanics

### What Will Be Preserved

- reducer-style core architecture
- reusable key vocabulary
- layered keyboard structure
- candidate list concept
- controlled/uncontrolled integration path
- demo/playground surface

## Phase 1: Reset Core Contracts

### Goal

Replace the guided-state contract with the new permissive-input contract.

### Steps

1. Simplify `KeyboardContext` to `legalMovesSan?: readonly string[]`.
2. Replace `KeyboardScreenState`-centric modeling with `KeyboardLayer`.
3. Remove ambiguity and promotion request types from the primary core contract.
4. Introduce `KeyboardBehaviorSettings`.
5. Define the new derived-state vocabulary:
   - `matchingMoves`
   - `exactMatches`
   - `highlightedKeyIds`
   - `shouldAutoSubmit`
6. Update submission metadata to distinguish:
   - manual submit
   - auto submit
   - candidate submit

### Deliverables

- stable simplified `src/core/types.ts`
- new settings contract
- updated component/core API direction consistent with the permissive-input model

### Status

Complete.

## Phase 2: Rewrite Core Reducer

### Goal

Refactor the headless core into a simple input reducer plus derived hints.

### Steps

1. Reduce core actions to:
   - `press-key`
   - `backspace`
   - `clear`
   - `clear-token`
   - `toggle-layer`
   - `set-legal-moves`
   - `set-settings`
   - `set-input`
2. Ensure every visible key press appends input without legality checks.
3. Derive `matchingMoves` by SAN prefix matching.
4. Derive `exactMatches` by exact SAN equality.
5. Derive `highlightedKeyIds` from “what append would preserve at least one legal SAN prefix”.
6. Derive `shouldAutoSubmit` from:
   - `settings.autoSubmit === true`
   - exactly one exact legal match
7. Keep the reducer pure and side-effect free.

### Deliverables

- simplified reducer in `src/core/state.ts`
- derived hint logic in focused helpers
- no legality-based key blocking

### Status

Complete.

## Phase 3: Simplify Hint Derivation

### Goal

Replace the old candidate/constraint machinery with straightforward SAN matching.

### Steps

1. Rework candidate logic around string matching only.
2. Candidate bar should show current `matchingMoves`.
3. Clicking a candidate should:
   - replace current input with that SAN
   - submit immediately with source `candidate`
4. Highlight logic should be toggleable with `settings.keyHighlights`.
5. Candidate bar visibility should be toggleable with `settings.candidateBar`.
6. Auto-submit should be toggleable with `settings.autoSubmit`.

### Deliverables

- simplified `candidates.ts`
- simplified highlight derivation
- settings-aware hint behavior

### Status

Complete.

## Phase 4: Rebuild Solid Integration

### Goal

Make the Solid layer reflect the new core contract instead of the previous guided-state design.

### Steps

1. Update the Solid reducer binding to use:
   - `legalMovesSan`
   - settings toggles
   - controlled/uncontrolled input support
2. Update `ChessKeyboard` so it:
   - never blocks input
   - emits `onChange` for every edit
   - emits `onSubmit` for manual, candidate, and auto submit paths
3. Remove ambiguity and promotion UI from the default component.
4. Keep the layer system, including a possible `settings` layer.
5. Keep the current fixed structural grid while the product iterates on layout.

### Deliverables

- updated `createChessKeyboardController`
- updated `ChessKeyboard`
- Solid API centered on value/change/submit instead of guided move-state

### Status

Substantially complete.

Completed:

- `ChessKeyboard` now uses the direct permissive-input API.
- controlled and uncontrolled input flows are supported.
- candidate clicks submit immediately.
- auto-submit emits only for unique exact legal SAN matches.
- the old ambiguity and promotion overlays were removed.

Remaining:

- remove any remaining legacy documentation/examples that still frame the package around the older controller-first model.

## Phase 5: Add Toggleable Settings Behavior

### Goal

Support runtime control over candidate bar, key highlights, and auto-submit.

### Steps

1. Add settings to the reducer state.
2. Accept settings via props and reducer actions.
3. Ensure each feature can be independently disabled:
   - candidate bar off
   - key highlights off
   - auto-submit off
4. Add a lightweight internal settings layer or placeholder entry point if useful, but do not over-design it yet.

### Deliverables

- settings-aware core behavior
- settings-aware Solid component behavior
- optional settings-layer hook point for later UI iteration

### Status

Complete.

Completed:

- settings are part of the reducer state.
- settings can be supplied externally.
- `defaultSettings` and `onSettingsChange` support uncontrolled and controlled settings flows.
- the component has a lightweight settings layer for toggling:
  - candidate bar
  - key highlights
  - auto-submit

## Phase 6: Update Demo and Validation Surface

### Goal

Use the demo to validate the new permissive-input model early.

### Steps

1. Update the example page to use `legalMovesSan`.
2. Add scenarios that stress:
   - notation-only input
   - starting position legal moves
   - ambiguity candidate behavior
   - promotion candidate behavior
   - invalid free-form input
3. Add controls for:
   - candidate bar on/off
   - key highlights on/off
   - auto-submit on/off
4. Use the demo as the primary review surface before more UI complexity is added.

### Deliverables

- updated playground
- clear visual validation surface
- ability to compare behavior with toggles enabled/disabled

### Status

In progress.

Completed:

- the demo uses `legalMovesSan`.
- the demo includes notation-only, starting-position, ambiguity, and promotion-style scenarios under the new permissive model.
- the demo no longer depends on the old controller-driven component path.

Remaining:

- expose the behavior toggles directly in the demo shell as explicit review controls in addition to the in-keyboard settings layer.
- add an invalid free-form input scenario explicitly.

## Phase 7: Core Tests

### Goal

Rebuild tests around the new contract.

### Steps

1. Remove or replace tests that assume legality-based blocking.
2. Add tests for free input entry.
3. Add tests for prefix matching and exact matching.
4. Add tests for key highlighting derivation.
5. Add tests for candidate click submission.
6. Add tests for manual submit of invalid input.
7. Add tests for auto-submit on unique exact match.
8. Add tests for auto-submit suppression when:
   - disabled via settings
   - there is no exact match
   - more than one exact match exists
9. Add tests for controlled and uncontrolled Solid flows.

### Deliverables

- tests aligned to the new permissive-input contract
- regression protection for toggles and submission behavior

### Status

In progress.

Completed:

- core tests now cover permissive input, prefix/exact matching, highlighting derivation, and submit behavior.
- Solid tests now cover:
  - free input `onChange`
  - candidate submit
  - auto-submit
  - settings-based suppression
  - settings-layer toggles
  - controlled input
  - controlled settings
  - key-highlights-off rendering

Remaining:

- expand demo-driven validation if new interaction branches are introduced.

## Phase 8: Cleanup and Deprecation

### Goal

Remove the remaining guided-state assumptions from the codebase.

### Steps

1. Delete obsolete ambiguity/promotion core types.
2. Delete obsolete board-aware context helpers that exceed `legalMovesSan`.
3. Simplify or remove any legacy controller API that no longer fits.
4. Update README and architecture notes to match the new product model.

### Deliverables

- cleaner package surface
- documentation aligned with actual behavior
- reduced maintenance burden from dual mental models

## Immediate Next Step

Recommended next implementation step:

1. Finish the validation surface by updating the demo shell with explicit toggle controls and at least one invalid-input scenario.
2. Add the remaining Solid integration tests for:
   - any future interaction branches introduced by layout iteration
