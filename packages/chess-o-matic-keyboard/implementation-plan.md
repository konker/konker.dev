# Chess-o-matic Keyboard Implementation Plan

## Overview

This document breaks the implementation into concrete phases for the initial version of `@konker.dev/chess-o-matic-keyboard`.

The initial implementation should prioritize:

- the reusable headless TypeScript core
- the SolidJS UI boilerplate needed to consume that core
- mobile-first interaction structure

The current design reference is [DESIGN.md](./DESIGN.md). Color treatment should be ignored for now. The design should be used primarily as an interaction and layout specification.

## Scope

The first implementation pass should:

- establish the core API boundary
- implement the keyboard state model
- support the major screen states described in the design
- provide SolidJS component scaffolding
- make the package ready for incremental UI and behavior work

The first implementation pass should not:

- fully polish visuals
- optimize theme styling
- build a web component
- overfit the package to one chess engine

## Phase 1: Core Contracts

### Goal

Define the canonical types and API surface for the headless keyboard core.

### Steps

1. Expand `src/core/types.ts` into the full domain model.
2. Define a `KeyboardScreenState` union:
   - `base`
   - `secondary`
   - `destination`
   - `ambiguity`
   - `promotion`
3. Define the normalized context model:
   - `KeyboardContext`
   - `turn`
   - `fen`
   - legal move lists
   - orientation
   - check state
4. Define input and move modeling types:
   - `KeyboardInputBuffer`
   - `MoveCandidate`
   - `PromotionRequest`
   - `DisambiguationRequest`
   - `SubmitResult`
5. Define a canonical key model:
   - stable key ids
   - labels
   - key categories
   - action vs notation keys
6. Define controller action signatures:
   - `pressKey`
   - `backspace`
   - `clear`
   - `clearToken`
   - `toggleSecondary`
   - `selectCandidate`
   - `setContext`
   - `submit`
   - `reset`

### Deliverables

- stable `src/core/types.ts`
- documented key vocabulary shared by core and UI
- updated controller interface consistent with the design states

## Phase 2: Core State Engine

### Goal

Implement the headless state machine and action handling.

### Steps

1. Split the current placeholder logic into focused modules:
   - `src/core/state.ts`
   - `src/core/controller.ts`
   - `src/core/normalizer.ts`
   - `src/core/tokenizer.ts`
   - `src/core/candidates.ts`
   - `src/core/enabled-keys.ts`
   - `src/core/context.ts`
2. Implement notation-only behavior first.
3. Define deterministic screen-state transitions:
   - `base -> destination`
   - `base <-> secondary`
   - `destination -> ambiguity`
   - `destination -> promotion`
   - completed move -> `base`
4. Build the input normalization rules.
5. Build tokenization rules for SAN-oriented input.
6. Implement initial candidate generation.
7. Implement enabled-key derivation for each screen state.
8. Ensure state transitions are pure and testable.

### Deliverables

- a working headless controller
- a pure state transition model
- initial support for all primary design states

## Phase 3: Board-Aware Hooks

### Goal

Introduce optional chess-aware behavior without coupling the core to a specific engine.

### Steps

1. Finalize the normalized board-aware context shape.
2. Implement `src/adapters/chessjs.ts`.
3. Use context to derive:
   - valid starting keys
   - valid destination files and ranks
   - ambiguity requirements
   - promotion requirements
4. Establish candidate ranking rules:
   - legal over illegal
   - complete over partial
   - exact context matches over syntax-only guesses
5. Keep the first board-aware implementation conservative and predictable.

### Deliverables

- working `chess.js` adapter
- core behavior that responds to legal move context
- board-aware enabled-key and candidate logic

## Phase 4: Core Tests

### Goal

Prove correctness in the headless layer before expanding UI complexity.

### Steps

1. Add tests for normalization behavior.
2. Add tests for tokenization behavior.
3. Add tests for controller action flows.
4. Add tests for screen-state transitions.
5. Add tests for ambiguity flows.
6. Add tests for promotion flows.
7. Add tests for notation-only mode.
8. Add tests for board-aware mode.
9. Add tests for enabled and disabled key derivation.

### Deliverables

- broad Vitest coverage for core behavior
- regression safety for future UI work

## Phase 5: UI Boilerplate

### Goal

Replace the current placeholder UI with a structured SolidJS integration layer.

### Steps

1. Replace the single placeholder keyboard component with composable UI pieces:
   - `ChessKeyboard`
   - `SanReadout`
   - `KeyGrid`
   - `ActionRow`
   - `CandidateBar`
   - `AmbiguityOverlay`
   - `PromotionPanel`
2. Add Solid integration helpers:
   - `createChessKeyboardController`
   - `useChessKeyboard` or equivalent
3. Keep the UI components state-driven and thin.
4. Ensure UI components only consume core state and dispatch core actions.
5. Build neutral structural styling only.

### Deliverables

- a modular SolidJS UI layer
- controller integration primitives for app usage
- minimal but usable component structure

## Phase 6: Functional UI States

### Goal

Implement the five UI states from the design in a functional, minimally styled form.

### Steps

1. Base state:
   - SAN readout
   - piece keys
   - file keys
   - rank keys
   - backspace
   - secondary toggle
2. Secondary menu state:
   - castling keys
   - check and mate keys
   - annotation keys
   - return toggle
3. Destination state:
   - selected piece or origin indicator
   - enabled and disabled destination keys
   - clear visual distinction for invalid keys
4. Ambiguity state:
   - prompt banner or overlay shell
   - only valid disambiguators shown or enabled
5. Promotion state:
   - dedicated 2x2 promotion selection panel
   - quick return to base state on completion

### Deliverables

- all primary design states represented in Solid
- functioning screen transitions wired to the core

## Phase 7: Interaction and Mobile Behavior

### Goal

Make the initial UI suitable for mobile-first usage.

### Steps

1. Ensure touch-friendly targets and spacing.
2. Avoid any hover-dependent interaction.
3. Ensure the keyboard can operate without native text input.
4. Add a clear readout/cursor treatment.
5. Support bottom-sheet style layout assumptions for mobile.
6. Add responsive hooks for tablet layouts.
7. Keep layout semantics compatible with Tauri mobile webviews.

### Deliverables

- mobile-usable interaction baseline
- responsive structure ready for later refinement

## Phase 8: UI Tests

### Goal

Verify the Solid UI behavior independently of visual polish.

### Steps

1. Add render tests for each screen state.
2. Add interaction tests for:
   - key presses
   - backspace
   - clear actions
   - secondary toggle
   - candidate selection
   - ambiguity resolution
   - promotion selection
3. Verify disabled keys are non-interactive.
4. Verify submit behavior from the UI layer.

### Deliverables

- UI-level regression coverage
- confidence in controller-to-view integration

## Immediate Next Tasks

The next concrete implementation steps should be:

1. Refactor the core into the planned module structure.
2. Define the canonical key model and screen-state model.
3. Implement the reducer or transition logic for the five design states.
4. Add tests for those state transitions.
5. Replace the placeholder UI with the Solid component skeleton.

## Open Decisions

### Ambiguity State Presentation

The design suggests a focused overlay. The implementation should follow that approach unless there is a strong usability reason to keep ambiguity resolution inside the normal grid footprint.

Recommended direction:

- implement ambiguity resolution as an overlay shell using the same controller state

### Visual Design Detail

The current plan does not require final visuals. It does require a basic layout direction.

If more visual guidance is needed later, the most useful additions would be:

- phone layout sketch
- tablet layout sketch
- candidate bar placement
- readout placement
- action key grouping

## Implementation Order Summary

1. Core contracts
2. Core state engine
3. Board-aware hooks
4. Core tests
5. UI boilerplate
6. Functional UI states
7. Mobile behavior
8. UI tests

This order keeps correctness and architecture ahead of visual refinement.
