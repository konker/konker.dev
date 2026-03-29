# Chess-o-Matic 3000 Architecture

This document describes the current technical architecture of `apps/chess-o-matic-3000`.
It is written for LLM/code agents and assumes the reader needs to get productive quickly without rediscovering the design from scratch.

## Project Summary

Chess-o-Matic 3000 is a SolidStart single-page chess application with:

- a browser chess board powered by `gchessboard`
- chess rules, SAN, FEN, and PGN powered by `chess.js`
- a move-history cursor layer that supports navigation backward/forward without losing future moves
- optional browser audio input via Vosk
- optional move sound output
- metadata editing that writes PGN headers
- multiple synchronized views of the same game state:
  - board
  - status
  - scoresheet
  - PGN
  - FEN

The app is intentionally client-only. `app.config.ts` sets `ssr: false`.

## High-Level Design

The app has three main layers:

1. `game-model`
   - owns canonical move history and the current cursor
   - uses `chess.js` for move legality and notation
   - reconstructs the current `Chess` instance from history + cursor

2. `game-engine`
   - orchestration layer
   - coordinates model, board controller, audio input/output, speech recognizer, and UI snapshots
   - exposes a stable instance API used by the Solid app

3. Solid UI components
   - `ChessOMatic3000App` is the stateful composition root
   - leaf components are mostly presentational and receive values/callbacks via props

## Directory Overview

Key areas under `src/`:

- `routes/index.tsx`
  - app entry route
  - sets page title and renders the app component

- `features/chess/components/`
  - UI components and feature-local view helpers

- `game-engine/`
  - instance-based engine orchestration

- `game-model/`
  - chess history, cursor, evaluation, parsing, and move application

- `audio-input/`
  - browser microphone capture and worklet setup

- `speech-recognizer/`
  - Vosk recognizer setup and chess grammar parsing

- `audio-output/`
  - move-result sound effects

## Runtime Entry Point

Route file:

- `src/routes/index.tsx`

Current behavior:

- sets `<Title>Chess-o-matic 3000</Title>`
- renders `ChessOMatic3000App`

The route is intentionally thin. The feature app component owns all actual runtime behavior.

## Main UI Composition

Main container:

- `src/features/chess/components/ChessOMatic3000App.tsx`

Responsibilities:

- creates the engine instance with `createGameEngine()`
- owns Solid signals for all UI state mirrored from the engine
- mounts the engine on `onMount`
- disposes the engine on `onCleanup`
- passes the board controller back to the engine
- composes all major panels

Current top-level UI sections:

- `StatusPanel`
- `GameNavigationPanel`
- `ControlsPanel`
- collapsible `Info` section containing `GameMetadata`
- collapsible `Scoresheet`
- collapsible `Board`
- collapsible `PGN`
- collapsible `FEN`

## Game Engine

Primary file:

- `src/game-engine/index.ts`

The engine is a factory, not a class:

- `createGameEngine(): GameEngine`

This is intentional. The engine is a stateful service object implemented as a closure-based factory.

### Public Engine API

Important methods:

- `init`
- `exit`
- `attachBoardController`
- `setGameMetadata`
- `goToStart`
- `goToPly`
- `stepBackward`
- `stepForward`
- `goToEnd`
- `isLegalMove`
- `getPromotionPieceColor`
- `handleBoardMove`
- `audioInputToggle`
- `audioOutputToggle`
- `isAudioInputOn`
- `isAudioOutputOn`

### Engine UI Snapshot

The engine emits a `GameEngineUiState` object via `onUiStateChange`.

Important fields:

- `fen`
- `pgn`
- `pgnMoveList`
- `scoresheetData`
- `currentPly`
- `canGoBackward`
- `canGoForward`
- `lastMoveSan`
- `lastInputSanitized`
- `lastInputEvaluateStatus`
- `lastInputResultMessage`

The UI does not directly inspect model internals. It reacts to these emitted snapshots.

### Important Engine Decisions

- The engine is the single orchestration point.
- Board updates happen through a small board controller interface, not by mutating DOM owned by Solid.
- Metadata changes immediately rewrite PGN headers and re-emit UI state.
- Navigation commands operate on the model cursor and then resync board/UI state.
- Voice `undo` is treated as navigation backward, not as a special mutation against a live `Chess` instance.

## Game Model

Primary file:

- `src/game-model/index.ts`

This is the most important current architectural decision:

The model no longer treats a single mutable `Chess` instance as the canonical game record.

Instead it stores:

- `moveHistory: Array<GameHistoryMove>`
- `currentPly: number`

and reconstructs:

- `chess: Chess`

from `moveHistory.slice(0, currentPly)`.

### Why This Matters

This enables:

- backward/forward navigation
- jump to arbitrary ply
- branching from an earlier point in history
- current board/FEN/PGN derived from the cursor
- full-history PGN move list and scoresheet staying visible even when the cursor is earlier

### Core Model Helpers

Important functions in `src/game-model/index.ts`:

- `gameModelPushHistoryMove`
- `gameModelCanGoBackward`
- `gameModelCanGoForward`
- `gameModelGoToStart`
- `gameModelStepBackward`
- `gameModelStepForward`
- `gameModelGoToEnd`
- `gameModelGoToPly`
- `gameModelCurrentMove`

### Move Application

Move application still uses `chess.js`:

- legality
- SAN
- FEN
- PGN
- move execution

Files:

- `src/game-model/move.ts`
- `src/game-model/extras.ts`

When a new move is made from an earlier cursor position:

- future history is truncated
- the new move is appended
- cursor advances to the new end

This app currently supports one active line, not alternate variations.

## Input Pipeline

Voice and textual inputs follow this rough flow:

1. speech recognizer returns text
2. `gameModelRead()` parses the text
3. `gameModelEvaluate()` resolves the parsed result into:
   - valid move
   - illegal move
   - control action
   - ignore
4. engine applies side effects and emits new UI state

Relevant files:

- `src/game-model/read.ts`
- `src/game-model/evaluate.ts`
- `src/speech-recognizer/grammar/chess-grammar-parser.ts`

Supported control actions currently include:

- board flip
- undo/backward navigation

## Board Integration

Primary component:

- `src/features/chess/components/ChessBoard/index.tsx`

The board wrapper is intentionally direct and `gchessboard`-specific.
There is no longer a separate runtime board-adapter folder.

### What `ChessBoard` Owns

- `<g-chess-board>` setup
- move event listeners
- promotion dialog UI
- board orientation toggle button
- last-move highlight inside the shadow DOM
- custom piece CSS
- cleanup on unmount

### Board Controller Contract

Defined in:

- `src/features/chess/components/ChessBoard/controller.ts`

Current controller surface:

- `renderPosition(fen, lastMove?)`
- `toggleOrientation()`
- `orientation()`

The engine attaches this controller and uses it to keep the visual board in sync with the model cursor.

## Metadata

Primary files:

- `src/features/chess/components/GameMetadata/index.tsx`
- `src/features/chess/components/GameMetadata/types.ts`
- `src/game-engine/game-metadata.ts`

Current metadata fields:

- Event
- Site
- Date
- Round
- Time Control
- Termination
- White name
- White Elo
- Black name
- Black Elo

Behavior:

- UI edits update local app signal
- app calls `gameEngine.setGameMetadata(...)`
- engine applies PGN tags through `applyGameMetadata(...)`
- UI state is re-emitted immediately so raw PGN updates

Current PGN tags written:

- `Event`
- `Site`
- `Date`
- `Round`
- `TimeControl`
- `Termination`
- `White`
- `WhiteElo`
- `Black`
- `BlackElo`

## PGN Panel

Primary files:

- `src/features/chess/components/PgnPanel/index.tsx`
- `src/features/chess/components/PgnPanel/types.ts`
- `src/features/chess/components/PgnPanel/move-history-to-pgn-move-list.ts`

Important behavior:

- two tabs:
  - `Moves`
  - `Raw PGN`
- copy button with a local `Copied` state
- copied state resets when PGN changes
- PGN move pills are clickable and navigate via `goToPly`
- current move is highlighted
- future moves remain visible and are muted
- panel content area has fixed height with internal scrolling

Design note:

The PGN move list is not parsed from the current PGN string.
It is derived from canonical move history.
This is deliberate and should remain so.

## Scoresheet

Primary files:

- `src/features/chess/components/ScoreSheet/index.tsx`
- `src/features/chess/components/ScoreSheet/types.ts`
- `src/features/chess/components/ScoreSheet/move-history-to-scoresheet-data.ts`

Current behavior:

- displays a minimum of 10 rows
- blank rows are shown before the game fills them
- grows beyond 10 rows as needed
- each move entry is clickable and navigates via `goToPly`
- current move is highlighted
- future moves remain visible and are muted
- rows have thin black dividers
- no header row
- fixed-height scrollable region

Important architectural note:

Scoresheet data is derived from full canonical move history, not current PGN.
This is what allows future moves to remain visible when navigating backward.

## FEN Panel

Primary file:

- `src/features/chess/components/FenPanel.tsx`

Current behavior:

- shows current cursor FEN
- copy button with `Copied` state
- copied state resets when FEN changes
- fixed-height scrollable display area

## Status Panel

Primary file:

- `src/features/chess/components/StatusPanel.tsx`

Behavior:

- displays last accepted SAN
- displays last result message
- displays sanitized input
- left border color reflects evaluation status:
  - ok: green
  - illegal: red
  - control: blue
  - ignore/default: grey

## Navigation and Cursor Semantics

This is central to understanding the app.

### Definitions

- full move = White move + Black move
- ply = one half-move
- `currentPly = 0` means the position before any move

### Navigation Rules

- `goToStart()` sets cursor to ply 0
- `stepBackward()` decrements one ply
- `stepForward()` increments one ply
- `goToEnd()` jumps to the final ply
- clicking a PGN or scoresheet item calls `goToPly(targetPly)`

### Display Rules

- board/FEN/raw PGN reflect the current cursor
- PGN move list and scoresheet reflect full recorded history
- past moves: normal
- current move: highlighted
- future moves: visible, muted, still clickable

## Audio Input and Speech Recognition

Relevant files:

- `src/audio-input/index.ts`
- `src/audio-input/audio-input-capture.worklet.ts`
- `src/speech-recognizer/index.ts`
- `src/speech-recognizer/grammar/chess-grammar-en.ts`
- `src/speech-recognizer/grammar/chess-grammar-parser.ts`

Behavior:

- microphone input is captured through an audio worklet
- audio frames are passed to Vosk in the browser
- recognizer results are parsed into chess commands

Current caveat:

- initialization requires the local Vosk model zip
- the UI surfaces a specific initialization error if the model is missing

## Audio Output

Relevant files:

- `src/audio-output/index.ts`
- `src/audio-output/sound-map.ts`
- `src/audio-output/standard.sound-map/`

Behavior:

- move result flags determine which sound to play
- audio output is toggleable independently of audio input

## Styling and UI Conventions

Current conventions:

- Tailwind is used primarily for structure/layout, not elaborate design abstraction
- feature-specific CSS remains only where needed:
  - `src/features/chess/chess-o-matic.css`
  - `src/features/chess/components/ChessBoard/gchessboard.css`
- icons are from `lucide-solid`

Important config detail:

- `lucide-solid` is aliased to its ESM bundle in both:
  - `app.config.ts`
  - `vitest.config.ts`

This alias exists because the default package resolution caused `.jsx` loading problems in tests.
Do not remove it casually.

## Testing Strategy

Vitest config:

- `vitest.config.ts`

Current test style:

- focused component tests
- JSDOM environment
- app shell test mocks the `ChessBoard` component
- `ChessBoard` has its own dedicated wrapper test
- PGN/FEN/metadata/scoresheet have focused render/interaction tests

Representative tests:

- `ChessOMatic3000App.test.tsx`
- `ChessBoard/ChessBoard.test.tsx`
- `PgnPanel/PgnPanel.test.tsx`
- `FenPanel.test.tsx`
- `GameMetadata/GameMetadata.test.tsx`
- `ScoreSheet/ScoreSheet.test.tsx`
- `game-model/extras.test.ts`
- grammar parser tests under `speech-recognizer/grammar/`

## Important Current Decisions

These are the current architectural decisions the code reflects.

1. The engine remains a factory, not a class.
2. The board wrapper is `gchessboard`-specific and lives directly inside `ChessBoard`.
3. Canonical move history and current cursor are stored separately from the live `Chess` instance.
4. Board, scoresheet, PGN, FEN, and status are all synchronized from engine UI snapshots.
5. PGN move list and scoresheet are based on full history, not cursor-truncated PGN.
6. Raw PGN and FEN are cursor-derived, because they represent the currently viewed position.
7. Metadata edits immediately affect PGN headers.
8. The app is client-only (`ssr: false`).

## Known Quirks / Caveats

- The folder and package are now `chess-o-matic-3000`, but some older filenames and CSS filenames still include `chess-o-matic`.
  - This is cosmetic, not currently a functional problem.
- `pgn-to-scoresheet-data.ts` still exists and is tested, but the runtime scoresheet now prefers `move-history-to-scoresheet-data.ts`.
  - Treat `move-history-to-scoresheet-data.ts` as the runtime source of truth.
- The model currently supports a single active line after branching.
  - There is no variation tree UI or storage yet.
- Some browser-specific integrations are hard to unit test and are intentionally isolated.

## If You Need To Change Behavior

Use these boundaries:

- change chess rules / legality / cursor semantics:
  - `game-model/`

- change orchestration / UI state emission / navigation commands:
  - `game-engine/index.ts`

- change board rendering or board-specific interactions:
  - `features/chess/components/ChessBoard/`

- change PGN move list UI:
  - `features/chess/components/PgnPanel/`

- change scoresheet rendering:
  - `features/chess/components/ScoreSheet/`

- change metadata form or PGN tags:
  - `features/chess/components/GameMetadata/`
  - `game-engine/game-metadata.ts`

## Suggested Reading Order For New Agents

If you are new to the codebase, read in this order:

1. `src/routes/index.tsx`
2. `src/features/chess/components/ChessOMatic3000App.tsx`
3. `src/game-engine/index.ts`
4. `src/game-model/index.ts`
5. `src/game-model/evaluate.ts`
6. `src/features/chess/components/ChessBoard/index.tsx`
7. `src/features/chess/components/PgnPanel/index.tsx`
8. `src/features/chess/components/ScoreSheet/index.tsx`
9. `src/features/chess/components/GameMetadata/index.tsx`

That path gives the fastest accurate overview of how the app works today.
