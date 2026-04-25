# Chess-o-matic 3000 - Architecture Review & Recommendations

Reviewed: 2026-04-05

## Overall Impression

This is a well-structured SolidJS application. The 3-layer architecture (game-model / game-engine / UI), the port/adapter pattern in `application/`, and the cursor-based move history design are all solid choices. The codebase is clean, types are thorough, and the ARCHITECTURE.md is exceptional documentation. Below are specific findings organized by category.

---

## 1. Dead / Unused Code

### Unused port interfaces

- `src/application/ports/SpeechInput.ts` — defined but never imported anywhere. The speech system is wired directly (Vosk + worklet) in the engine.
- `src/application/ports/AudioOutput.ts` — defined but never consumed. Audio output uses `AudioOutputResources` directly.

### Unused command/event types

- `src/application/types/app-commands.ts` — `AppCommand` union and all its constituent types are defined but never imported or used anywhere in the codebase.
- `src/application/types/app-events.ts` — same situation. `AppEvent` union is unused.

These look like forward-looking designs that were never wired up. They're interesting for the future sync/command-bus direction (see section 3), but currently they're dead weight.

### Dead `locked` field

- `GameModelResources.locked` is defined in `src/game-model/index.ts:25`, initialized to `false`, but never read or written in production code (only asserted in one test).

### Legacy `pgn-to-scoresheet-data.ts`

- `src/features/chess/components/ScoreSheet/pgn-to-scoresheet-data.ts` still exists with its own test, but is not imported in production code. It's the only consumer of the `chessops` dependency. Removing it would let you drop `chessops` from `package.json`.

### `ComSettings` class

- `src/settings.ts` defines a mutable class `ComSettings`, but the engine never constructs it — it builds structurally compatible plain objects via `currentComSettings()`. The class is technically consumed by `audio-output/index.ts` as a type, but only via structural typing. This is confusing and inconsistent with the rest of the codebase which uses plain types and closures.

---

## 2. Architecture Concerns

### Game engine is too large (1165 lines)

`src/game-engine/index.ts` is the single biggest concern. It handles initialization, teardown, audio I/O management, speech recognition, game model sync, persistence, board controller management, navigation, game lifecycle (new/discard/reset/load/save), export, external open, and UI state emission — all in one closure.

Suggested breakdown:

- **Audio management** — extract audio input/output lifecycle, toggle logic, and settings sync
- **Game lifecycle** — extract new, discard, reset, load, save game flows
- **Navigation** — extract navigation methods + status snapshot creation

These could be internal modules that the engine composes rather than inlines.

### `GamesPage` bypasses the engine

`src/routes/games.tsx:150` creates its own `createBrowserGameStorage()` instance, then directly reads/writes game data (load index, delete games, rename via save). This creates a parallel storage pathway that:

- Bypasses the engine's state management
- Won't participate in future sync
- Could cause stale-data issues if the user has the game page open and the history page simultaneously

For backend sync readiness, the games page should route through the engine (or at least a shared service instance). One approach: the engine could expose a `GameLibrary` sub-interface for listing/renaming/deleting saved games.

### Inconsistent persistence awaiting

In some engine methods, persistence is fire-and-forget:

```typescript
// toggleBoardOrientation, setGameMetadata
void syncPersistedCurrentGame(appState.currentGame);
void persistAppState();
```

In others, it's awaited:

```typescript
// newGame, loadSavedGame, etc.
await syncPersistedCurrentGame(nextAppState.currentGame);
await persistAppState();
```

For a local-only app this is harmless, but for future sync it's a consistency problem. The fire-and-forget paths could silently lose updates if a sync adapter throws.

### Re-export shims in feature components

`features/chess/components/PgnPanel/move-history-to-pgn-move-list.ts` and `features/chess/components/ScoreSheet/move-history-to-scoresheet-data.ts` are single-line re-exports from `application/selectors/`. These exist but aren't consumed by the feature components themselves (the engine passes pre-computed data via props). They appear to be remnants. Removing them simplifies the dependency graph.

---

## 3. Sync / Backend Readiness

The `GameStorage` port/adapter pattern is the right foundation. To support transparent instant sync:

- **`GameStorage` port is clean** — the interface (`loadAppState`, `saveAppState`, `saveGame`, `loadGame`, `deleteGame`, `loadSavedGameIndex`) maps well to a sync adapter. A sync-aware implementation could optimistically write locally then push to backend.

- **Missing: user identity in data model** — `GameRecord` has no owner/user field. When adding auth, you'll need to associate records with a user ID. This is a schema migration (version 2).

- **Missing: conflict resolution** — the current model overwrites on save. Multi-device sync needs either last-write-wins timestamps, CRDTs for move history, or a simpler "server-wins" merge strategy.

- **The unused `AppCommand` / `AppEvent` types are interesting** — they describe a command/event pattern that could serve as the foundation for a sync protocol (commands sent to backend, events received). If this was your intent, consider wiring them into the engine now as the canonical API, then the sync layer becomes a transport for these messages.

- **Schema versioning is already in place** (`version.ts`) — good. Migration functions exist in `serialization.ts`.

---

## 4. Tauri v2 Considerations

- **Storage adapter** — `localStorage` works in Tauri's WebView, but has size limits. For larger game libraries, you'll want a Tauri-specific adapter using the `tauri-plugin-store` or a SQLite-based adapter via `tauri-plugin-sql`. The port pattern supports this cleanly.

- **Clipboard** — `navigator.clipboard.writeText()` in `ChessOMatic3000App.tsx:211,217` works in Tauri WebView on most platforms, but may silently fail on some. Consider adding a Tauri-specific clipboard adapter (using `@tauri-apps/plugin-clipboard-manager`). You could add a `Clipboard` port alongside the existing ports.

- **External URLs** — `window.open()` in `BrowserExternalOpen.ts` won't open the system browser in Tauri. You'll need `@tauri-apps/plugin-opener` to invoke the system browser. The `ExternalOpen` port already abstracts this, so you'd just add a Tauri adapter.

- **Audio worklet** — should work in Tauri's WebView (WebKit/Chromium). Test on iOS specifically, as WKWebView has historically been stricter about audio context policies.

- **Deep linking** — for `/?gameId=xxx` patterns when opened from notifications or external links, you'll need Tauri's deep link plugin.

---

## 5. Scoresheet-Only Mode Readiness

The architecture already supports this well:

- `CollapsibleSection` with `storageKey` gives per-section visibility persistence
- The engine emits scoresheet data independently of the board
- The board controller is optional (attached via `attachBoardController`)

To implement this, you'd need:

- A mode flag (app state or route) that controls which sections render
- When in scoresheet-only mode: skip rendering the `ChessBoard` component entirely (don't just hide it)
- The dedicated SAN entry keyboard (external component) would feed into `gameEngine.handleBoardMove(san)` which already accepts string SAN input
- You may want to suppress `attachBoardController` in this mode to avoid the "board controller not attached" guard in `audioInputOn`

---

## 6. Test Coverage

All 131 tests pass. Coverage (at the 100% threshold):

| Area                     | Lines | Notes                                                                                                                  |
| ------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| `game-model/`            | 96%   | Strong coverage. `read.ts` at 77% could use tests for the coords and unknown-control-action branches                   |
| `game-engine/index.ts`   | 75%   | Missing coverage on: game lifecycle paths (reset, export scoresheet), persistence edge cases, board orientation toggle |
| `audio-output/index.ts`  | 55%   | Browser audio API is hard to test; consider extracting the logic from the Web Audio calls                              |
| `ChessOMatic3000App.tsx` | 50%   | Most handlers are untested because the test uses `autoloadEngine: false`                                               |
| `StatusPanel.tsx`        | 67%   | The `scrollPanelToTop` function and several render branches are uncovered                                              |
| `ChessBoard/index.tsx`   | 70%   | Promotion dialog, orientation change side-effects, and cleanup paths                                                   |

### Specific recommendations

- `game-engine` tests are well-structured but could benefit from a shared test harness (the test setup with mock adapters is repeated across `index.test.ts` and `lifecycle.test.ts`)
- `StatusPanel.scrollPanelToTop` directly queries the DOM with `document.querySelector('.app-header')` — this couples a presentational component to a CSS class in a parent. Consider passing a ref or using a callback prop instead.

---

## 7. Minor Issues

- **Typo in `audio-input/index.ts:86`**: `chesss-o-matic` (three s's) in the console.warn message.

- **`initComSettings` in `settings.ts`** is an async function that does no async work — it just returns `new ComSettings(...)`. The `async` is misleading.

- **Inconsistent naming**: `boardAdapterUpdateMovedSoundsOk` / `boardAdapterUpdateMovedSoundsInvalid` / `boardAdapterUpdateControlSounds` in `audio-output/index.ts` still carry the "boardAdapter" prefix from an older architecture where there was a separate board adapter layer. These are just audio playback functions now.

- **`boardAdapterUpdateControlSounds`** is a no-op function (empty body, returns void). It's exported but never called. Dead code.

---

## 8. Summary of Recommended Actions

### Quick wins (cleanup)

1. Remove unused ports: `SpeechInput.ts`, `AudioOutput.ts`
2. Remove unused types: `app-commands.ts`, `app-events.ts` (or wire them up)
3. Remove `pgn-to-scoresheet-data.ts` + its test, drop `chessops` dependency
4. Remove re-export shims in feature component directories
5. Remove `locked` field from `GameModelResources`
6. Replace `ComSettings` class with a plain type, or remove `settings.ts` entirely and inline the type
7. Remove dead `boardAdapterUpdateControlSounds` function
8. Fix `chesss-o-matic` typo

### Structural (for planned features)

1. Break up `game-engine/index.ts` into composable sub-modules
2. Route `GamesPage` storage access through the engine (or a shared service) so it participates in future sync
3. Make persistence awaiting consistent (always await or always use a queue)
4. Add a `Clipboard` port for Tauri readiness
5. Add a `userId` / owner concept to `GameRecord` for auth readiness

### Test coverage

1. Add a shared test harness for game-engine tests to reduce setup duplication
2. Increase `game-engine/index.ts` coverage on lifecycle paths (reset, export, discard)
3. Test `StatusPanel` scroll behavior via callback prop instead of DOM query
