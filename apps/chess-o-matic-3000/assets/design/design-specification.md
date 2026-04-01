# Chess-o-matic 3000 Design Specification

## Purpose

This document captures the current visual design direction for the Chess-o-matic 3000 app before implementation work begins.

The goal is a minimalist and clean UI using Tailwind CSS v4, with a clear distinction between:

- the analogue core of the app, represented by the scoresheet
- the digital augmentation layer, represented by everything surrounding the scoresheet

## Core Design Principle

The app should not be styled as a single metaphor.

Instead, it should present:

- a **traditional analogue artifact**: the chess scoresheet
- surrounded by **modern digital tools** that enhance, inspect, and control that record

This means the scoresheet should feel like a physical object used in over-the-board chess, while the rest of the UI should feel modern, utilitarian, and functional.

## Aesthetic Direction

### General

- minimalist
- clean
- square-edged or nearly square-edged
- no gradients
- no overly rounded corners
- subtle shading and subtle tone variation are welcome
- visually distinct sections
- future app furniture should be easy to add without redesigning the whole shell

### Typography

- prefer sans-serif for general UI text
- monospace is appropriate for notation-heavy or technical elements
- likely direction:
  - body/interface text: sans-serif
  - notation/data/status emphasis: monospace where helpful

### Layout

- overall shell should feel like a digital workspace
- the scoresheet should read as the central analogue record
- digital tools should be clearly separated into their own panels or zones
- spacing and thin rules should do more work than decorative effects

## Color Strategy

Base palette is defined in [color-palette.md](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/assets/design/color-palette.md).

### Workspace / Digital Tokens

Use the existing palette for most of the application shell and utility surfaces:

- `neutral` for text, borders, backgrounds, and separation
- `forest` for primary accent and active brand-adjacent states
- `cobalt` for information and utility actions
- `wood` sparingly where warmth is useful near the board
- `gold` for restrained highlight use
- `berry` for palette-aligned warning/error use where strict operational semantics are not required

### Scoresheet / Analogue Tokens

The scoresheet should use its own subset of warmer and paper-like tones:

- warm off-white / paper surfaces
- darker ink-like text
- faint ruled lines
- subtle tonal variation rather than decorative effects

### Operational Status Colors

The status panel is exempt from the brand/palette coherence rule.

It should use explicit, familiar status colors for clarity:

- green for successful move acceptance
- red for illegal/error states
- blue for control or command states
- gray or neutral for idle/ignore states

This is intentional because the app may be used with speech input while the user is not looking directly at the interface.

## Metaphor Boundaries

### Strong Analogue Metaphor

Only the scoresheet should strongly embody the physical metaphor.

### Hybrid Zone

Metadata may borrow from paper-form conventions for inputs, but should still feel like a modern data-entry surface overall.

### Fully Digital / Modern

These components should feel modern, direct, and utilitarian:

- status panel
- chess board container and controls
- navigation controls
- action toolbars
- PGN panel
- FEN panel
- section chrome and collapsible affordances
- app shell and future app furniture

## Component Guidance

## App Shell

File: [ChessOMatic3000App.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ChessOMatic3000App.tsx)

- move away from a simple vertical stack toward a clearer workspace structure
- reserve visual space for future furniture such as hamburger menu and user/avatar affordances
- establish stronger grouping between:
  - status
  - navigation and control tools
  - analogue scoresheet
  - digital analysis/utility panels
- footer may be added with minimal content and light visual weight

## Status Panel

File: [StatusPanel.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/StatusPanel.tsx)

This component should prioritize function over stylistic coherence.

- should be readable at a glance
- should provide immediate visual confirmation of the last move and current state
- should use strong semantic color coding even if it deviates from the main palette
- should emphasize `lastMoveSan` as the dominant visual element
- should present supporting message text clearly beneath
- should keep recognized speech text visible but secondary
- should feel more like an operational display than part of the paper/scoresheet system

## Scoresheet

File: [ScoreSheet/index.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ScoreSheet/index.tsx)

This is the primary analogue artifact in the app.

- should resemble a chess scoresheet filled out by hand
- use ruled rows and tabular numerals
- keep strong separation between move number, White move, and Black move columns
- use subtle paper tones and ink-like text
- use restrained active-row highlighting
- avoid decorative card styling

## Metadata Panel

File: [GameMetadata/index.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/GameMetadata/index.tsx)

- overall panel should feel modern and structured
- inputs may borrow from paper-form conventions
- preferred text input style:
  - bottom border
  - short left and right borders rising from the bottom, no more than halfway
  - should evoke a paper form line rather than a boxed field
- labels should be compact and clear
- White and Black player blocks should read as paired structured data groups

## Chess Board

File: [ChessBoard/index.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ChessBoard/index.tsx)

- should feel crisp, modern, and precise
- square corners
- restrained framing
- controls should be compact and utilitarian
- board-adjacent controls should not mimic paper
- board color selector should avoid rounded treatments
- highlight states should remain clear but controlled

## PGN Panel

File: [PgnPanel/index.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/PgnPanel/index.tsx)

PGN is a digital counterpart to the traditional scoresheet.

- should feel modern and utilitarian
- should not follow the paper metaphor
- monospace is appropriate
- tabs should feel like digital controls, not stationery
- move items should use square or low-radius treatments
- raw PGN view should feel like a compact notation/editor utility

## FEN Panel

File: [FenPanel.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/FenPanel.tsx)

FEN is also a digital utility surface.

- should feel compact, technical, and modern
- monospace is appropriate
- should not borrow from the paper metaphor
- should visually align with PGN as a utility panel

## Section Chrome

File: [CollapsibleSection.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/CollapsibleSection.tsx)

- section headers should act as modern structural chrome
- use thin rules, tone changes, spacing, and typography to separate sections
- avoid generic card UI
- avoid faux paper treatment by default
- each section should be visually distinct without looking heavy

## Controls and Toolbars

Files:

- [GameNavigationPanel.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/GameNavigationPanel.tsx)
- [GameDataToolbar.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/GameDataToolbar.tsx)
- [ControlsPanel.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ControlsPanel.tsx)
- [ExternalOpenToolbar.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ExternalOpenToolbar.tsx)

- should feel like modern control surfaces
- should be visually grouped and consistent
- should use clean, compact button treatments
- should avoid overly soft or playful styling
- labels should remain available for now; future smaller form factors may switch more heavily toward icons

## Responsiveness

Implementation should not overfit to the current narrow stacked layout.

- current styling may remain mostly stacked
- structure should anticipate larger form factors
- future tablet/desktop layouts may show more verbose labels
- some sections may later move side-by-side
- the visual system should support that without requiring a conceptual redesign

## Tailwind v4 Implementation Direction

Use Tailwind CSS v4 as the styling framework.

Recommended approach:

- define semantic theme tokens in `src/app.css`
- separate tokens into:
  - digital workspace tokens
  - analogue scoresheet tokens
  - operational status tokens
- use shared utility/component classes for repeated patterns such as:
  - section headers
  - control buttons
  - utilitarian panels
  - paper-form inputs
  - scoresheet rows

## Concrete Tailwind v4 Implementation Plan

This section turns the design direction into an implementation strategy for the current codebase.

## 1. Theme Tokens

Primary file:

- [app.css](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/app.css)

Add semantic tokens in Tailwind v4 using `@theme`.

Recommended token groups:

### Digital Workspace Tokens

- `--color-bg-app`
- `--color-bg-panel`
- `--color-bg-panel-muted`
- `--color-bg-panel-strong`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-border-subtle`
- `--color-border-strong`
- `--color-accent-primary`
- `--color-accent-info`
- `--color-accent-warm`

Suggested mapping:

- app background: `neutral-100`
- panel background: white or near-white
- muted panel background: a very light neutral or cobalt/forest tint
- primary text: `neutral-700`
- secondary text: `neutral-400` or `neutral-500`
- subtle border: `neutral-200` or `neutral-300`
- strong border: `neutral-400`
- primary accent: `forest-400`
- info accent: `cobalt-400`
- warm accent: `wood-300`

### Scoresheet / Analogue Tokens

- `--color-sheet-bg`
- `--color-sheet-bg-alt`
- `--color-sheet-ink`
- `--color-sheet-rule`
- `--color-sheet-rule-strong`
- `--color-sheet-active`

Suggested mapping:

- sheet background: warm paper tone derived from `gold-100`, `wood-100`, or a custom off-white
- sheet alternate background: slightly darker paper tint
- sheet ink: dark neutral or wood-adjacent deep tone
- sheet rules: muted neutral/wood blend
- active row: pale gold or pale forest wash

### Operational Status Tokens

These should be independent from the brand palette.

- `--color-status-success-bg`
- `--color-status-success-border`
- `--color-status-success-text`
- `--color-status-error-bg`
- `--color-status-error-border`
- `--color-status-error-text`
- `--color-status-info-bg`
- `--color-status-info-border`
- `--color-status-info-text`
- `--color-status-neutral-bg`
- `--color-status-neutral-border`
- `--color-status-neutral-text`

These should use clear, conventional greens, reds, blues, and grays with strong contrast.

### Typography Tokens

- `--font-body`
- `--font-data`

Recommended direction:

- `--font-body`: clean sans-serif stack
- `--font-data`: monospace stack

Use `font-data` for:

- SAN
- PGN
- FEN
- move numbers
- other notation-heavy UI

## 2. Global Base Layer

Primary file:

- [app.css](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/app.css)

Expand the global layer beyond the current minimal reset.

Recommended additions:

- set app background color from semantic tokens
- set global text color
- establish default body font
- ensure buttons inherit typography and reset browser defaults cleanly
- define default focus ring behavior
- define selection color

Add reusable utility/component classes for:

- `.app-shell`
- `.panel`
- `.panel-muted`
- `.panel-utility`
- `.section-summary`
- `.toolbar-button`
- `.toolbar-button-primary`
- `.toolbar-button-danger`
- `.utility-tab`
- `.utility-tab-active`
- `.scoresheet-shell`
- `.scoresheet-row`
- `.paper-input`
- `.status-surface`

These can live in `@layer components` so class strings in TSX stay readable.

## 3. Shell Structure

Primary file:

- [ChessOMatic3000App.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ChessOMatic3000App.tsx)

### Problems in Current Structure

- currently reads as a simple linear stack
- toolbars do not feel grouped as a coherent control area
- no shell-level distinction between analogue and digital zones
- no obvious reserved structure for future app furniture

### Implementation Direction

- wrap the page in an outer shell with a constrained content width
- add a top header band with:
  - title block
  - optional placeholder area for future menu/avatar furniture
- group navigation, game actions, audio controls, and external actions into a shared utility zone
- keep status near the top as the primary feedback surface
- make the scoresheet and board feel like the most important working surfaces
- keep PGN/FEN as clearly secondary utilities

### Suggested Short-Term Layout

- header
- status
- control zone
- metadata
- scoresheet
- board
- PGN
- FEN
- footer

This can still be stacked for now while using stronger section framing.

## 4. Section Framework

Primary file:

- [CollapsibleSection.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/CollapsibleSection.tsx)

### Problems in Current Structure

- summary row is too plain
- sections do not have enough visual separation
- no consistent chrome for section identity

### Implementation Direction

- make the section wrapper responsible for structural rhythm
- add a header row with:
  - icon
  - title
  - open/closed affordance
  - subtle uppercase or small label styling
- add a panel body with padding and a distinct background tone
- use square corners and thin borders/rules
- allow section variants later if needed, but start with one clean default

## 5. Status Panel

Primary file:

- [StatusPanel.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/StatusPanel.tsx)

### Problems in Current Structure

- presentationally too subtle for speech-driven feedback
- thick left border is not enough signal
- SAN, message, and status metadata do not have a strong visual hierarchy

### Implementation Direction

- create a large, highly legible signal panel
- give the entire panel a semantic background/border treatment per status
- make `lastMoveSan` the largest element
- use monospace or semi-monospace emphasis for move notation
- keep a compact status label visible in the header row
- present recognized speech text in a quieter secondary zone
- use large spacing and high contrast so the panel reads quickly from peripheral vision

### Suggested Class Model

- root:
  - `status-surface`
  - `data-[status=ok]:...`
  - `data-[status=illegal]:...`
  - `data-[status=control]:...`
  - `data-[status=ignore]:...`
- SAN:
  - large mono
  - high weight
- metadata:
  - small uppercase/label text

## 6. Controls and Toolbars

Primary files:

- [GameNavigationPanel.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/GameNavigationPanel.tsx)
- [GameDataToolbar.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/GameDataToolbar.tsx)
- [ControlsPanel.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ControlsPanel.tsx)
- [ExternalOpenToolbar.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ExternalOpenToolbar.tsx)

### Problems in Current Structure

- buttons are mostly unstyled
- icon-only navigation controls risk feeling disconnected from the rest of the system
- action groups are visually fragmented

### Implementation Direction

- standardize buttons through shared toolbar classes
- use compact square or low-radius controls
- introduce button variants:
  - neutral
  - primary
  - danger
  - active/toggled
- keep icon-plus-label layout where labels already exist
- for navigation controls, consider enclosing them in a grouped segmented control

## 7. Metadata Panel

Primary file:

- [GameMetadata/index.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/GameMetadata/index.tsx)

### Problems in Current Structure

- browser-default inputs break visual coherence
- player sections do not yet feel like structured related blocks
- labels are not visually disciplined

### Implementation Direction

- make metadata a modern panel using structured spacing and grid alignment
- use compact labels
- use the paper-form input treatment only at field level, not panel level
- style `input` and `select` consistently
- style White and Black sections as paired sub-panels with matching internal rhythm

### Paper-Form Input Pattern

Implement a reusable field shell for text inputs/selects:

- bottom border across full width
- short left and right vertical strokes that rise part-way
- no full box outline
- subtle focus state using accent color
- subdued placeholder styling

This may require either:

- wrapper elements around native controls
- or carefully composed pseudo-elements via a shared class

## 8. Scoresheet

Primary file:

- [ScoreSheet/index.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ScoreSheet/index.tsx)

### Problems in Current Structure

- currently looks like a generic text grid
- active move indication is too lightweight
- no strong sheet identity

### Implementation Direction

- make the scoresheet feel like the one true analogue object in the UI
- create a dedicated scoresheet shell distinct from generic panels
- introduce:
  - paper-toned background
  - ruled horizontal lines
  - a move-number gutter
  - clear white/black move columns
  - subtle vertical separators
- use tabular numerals and mono or notation-friendly text where appropriate
- use a restrained current-row highlight and current-move emphasis

### Suggested Supporting Details

- keep row height consistent
- maintain visible empty rows to reinforce the sheet metaphor
- avoid shadows that make it feel like a floating card

## 9. Chess Board Panel

Primary file:

- [ChessBoard/index.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ChessBoard/index.tsx)

### Problems in Current Structure

- board controls are too generic
- color-scheme toggle uses a rounded shape that conflicts with the desired direction
- surrounding surface has little design language

### Implementation Direction

- keep the chessboard itself crisp and central
- wrap the board in a modern utility panel
- replace rounded board-scheme toggle with square swatch/toggle treatment
- style board controls consistently with the toolbar system
- use thin framing around the board rather than heavy chrome
- style promotion dialog as a compact modern utility overlay

## 10. PGN Panel

Primary file:

- [PgnPanel/index.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/PgnPanel/index.tsx)

### Problems in Current Structure

- rounded move pills do not fit the design direction
- tabs feel generic
- raw view lacks utility-panel styling

### Implementation Direction

- treat PGN as a digital notation tool
- use monospace where appropriate
- style tabs as a utilitarian segmented or underline control
- replace rounded move pills with square or low-radius notation chips/cells
- create stronger distinction between active, past, and future moves
- give the raw PGN area a denser technical surface treatment

## 11. FEN Panel

Primary file:

- [FenPanel.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/FenPanel.tsx)

### Problems in Current Structure

- currently too bare
- lacks relationship to PGN as part of the digital utility layer

### Implementation Direction

- style FEN as a compact technical readout
- monospace text
- utility-panel container
- prominent but compact copy action
- scrollable string presentation with good readability

## 12. Footer

Primary file:

- [ChessOMatic3000App.tsx](/home/konker/WORKING/konker/konker.dev/apps/chess-o-matic-3000/src/features/chess/components/ChessOMatic3000App.tsx)

### Implementation Direction

- add a very light footer treatment
- minimal content only
- thin top rule
- small text
- should primarily establish long-term shell structure rather than carry content

## 13. Responsive Strategy

Do not overfit styles to the current narrow stack.

### Short-Term

- mobile-first stacked layout
- clear section rhythm
- controls wrap cleanly

### Medium-Term

- allow tablet layout to place some sections side-by-side
- preserve labels on medium sizes
- allow more descriptive chrome at wider widths

### Long-Term

- header can absorb future menu/avatar/furniture
- utility and analogue zones may become more spatially distinct

## 14. Suggested Delivery Order

Implement in this order to reduce churn:

1. theme tokens and global component classes in `src/app.css`
2. app shell structure in `ChessOMatic3000App.tsx`
3. section chrome in `CollapsibleSection.tsx`
4. status panel redesign
5. shared toolbar/button styling across control components
6. metadata panel and paper-form field treatment
7. scoresheet styling
8. board panel and board controls
9. PGN panel redesign
10. FEN panel redesign
11. footer

## 15. Success Criteria

The implementation should be considered successful when:

- the scoresheet is visually legible as the analogue record
- the status panel is instantly readable from a glance
- PGN and FEN clearly read as digital tooling
- controls and sections feel systematic rather than incidental
- the UI remains restrained and minimal without feeling unfinished
- future shell furniture can be added without disrupting the design language

## Summary

The intended experience is:

- the **scoresheet** feels like the formal, traditional record of the game
- the **status panel** feels like an obvious real-time feedback display
- the **PGN and FEN panels** feel like digital utility views
- the **board and controls** feel like modern tools surrounding the analogue record
- the app as a whole feels minimal, clear, structured, and ready to grow
