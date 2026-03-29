# Chess-o-matic 3000 Icon Spec

## Purpose

This document defines the SVG icons needed for the current UI and a shortlist of likely future icons.
The goal is consistency in naming, placement, and intended meaning before assets are sourced.

## Current Controls

### Game Navigation

- `game-go-to-start`
  - Suggested glyph: `skip-back`
  - Current label: `|<`
  - Meaning: jump to the first ply of the game

- `game-step-backward`
  - Suggested glyph: `chevron-left`
  - Current label: `<`
  - Meaning: go back one ply

- `game-step-forward`
  - Suggested glyph: `chevron-right`
  - Current label: `>`
  - Meaning: go forward one ply

- `game-go-to-end`
  - Suggested glyph: `skip-forward`
  - Current label: `>|`
  - Meaning: jump to the final ply in the current line

### Audio Controls

- `audio-input-on`
  - Suggested glyph: `mic`
  - Current label: `Enable Audio Input`
  - Meaning: voice input available / enabled

- `audio-input-off`
  - Suggested glyph: `mic-off`
  - Current label: `Disable Audio Input`
  - Meaning: voice input muted / disabled

- `audio-output-on`
  - Suggested glyph: `volume-2`
  - Current label: `Enable Audio Output`
  - Meaning: move sounds available / enabled

- `audio-output-off`
  - Suggested glyph: `volume-x`
  - Current label: `Disable Audio Output`
  - Meaning: move sounds muted / disabled

### Board Controls

- `board-toggle-orientation`
  - Suggested glyph: `rotate-cw`
  - Current label: `Toggle Board Orientation`
  - Meaning: flip board perspective

### Clipboard Actions

- `copy-pgn`
  - Suggested glyph: `copy`
  - Current label: `Copy PGN`
  - Meaning: copy current PGN text to clipboard

- `copy-fen`
  - Suggested glyph: `copy`
  - Current label: `Copy FEN`
  - Meaning: copy current FEN text to clipboard

## Recommended Panel Icons

These are not required yet, but are the most likely next additions if headers or collapsible summaries gain icons.

- `panel-status`
  - Suggested glyph: `info`
  - Meaning: current move / evaluation status

- `panel-game-controls`
  - Suggested glyph: `panel-top`
  - Meaning: navigation and game-level actions

- `panel-game-metadata`
  - Suggested glyph: `sliders-horizontal`
  - Meaning: editable game tags and player/event metadata

- `panel-scoresheet`
  - Suggested glyph: `notebook-pen`
  - Meaning: move list in scoresheet form

- `panel-board`
  - Suggested glyph: `grid-3x3`
  - Meaning: interactive chess board

- `panel-pgn`
  - Suggested glyph: `file-text`
  - Meaning: PGN move list / raw PGN text

- `panel-fen`
  - Suggested glyph: `binary`
  - Meaning: current board position string

- `panel-collapse-open`
  - Suggested glyph: `chevron-down`
  - Meaning: section expanded

- `panel-collapse-closed`
  - Suggested glyph: `chevron-right`
  - Meaning: section collapsed

## Metadata Field Icons

These may be useful later if the metadata form becomes more compact or label-driven.

- `metadata-event`
  - Suggested glyph: `trophy`
  - Meaning: event name

- `metadata-site`
  - Suggested glyph: `map-pin`
  - Meaning: site / venue

- `metadata-date`
  - Suggested glyph: `calendar`
  - Meaning: game date

- `metadata-round`
  - Suggested glyph: `hash`
  - Meaning: round number

- `metadata-time-control`
  - Suggested glyph: `clock-3`
  - Meaning: time control

- `metadata-player`
  - Suggested glyph: `user`
  - Meaning: player name

- `metadata-elo`
  - Suggested glyph: `badge`
  - Meaning: player rating

## Future Utility Icons

- `clipboard-success`
  - Suggested glyph: `clipboard-check`
  - Meaning: copied successfully state

- `download-export`
  - Suggested glyph: `download`
  - Meaning: export PGN or scoresheet

- `print-scoresheet`
  - Suggested glyph: `printer`
  - Meaning: print final scoresheet

- `game-result`
  - Suggested glyph: `flag`
  - Meaning: resign / result / termination actions

## Sourcing Notes

- Prefer a single icon family for all UI controls.
- Use outline icons or simple filled icons consistently, not a mix.
- Keep stroke weight visually consistent across buttons and panel headers.
- Source square or near-square SVGs that scale cleanly to small button sizes.
- Avoid overly decorative chess-themed icons for generic actions like copy, audio, or collapse.
