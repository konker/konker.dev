# The Tactical Grid

## Product Overview

**The Pitch:** A context-aware mobile keyboard engineered exclusively for rapid Standard Algebraic Notation (SAN) chess move entry. It anticipates legal moves, dynamically shifts visual weight, and eliminates invalid inputs, accelerating transcription for analysts and power users.

**For:** Chess coaches, tournament arbiters, and hardcore players who need to digitize physical games or input variations with zero friction.

**Device:** mobile

**Design Direction:** A deep slate tactical HUD featuring stark geometry, monospaced data readouts, and high-contrast electric blue and bright green neon accents to telegraph valid paths.

**Inspired by:** Lichess (mobile analysis board), Destiny 2 (menu HUDs)

---

## Screens

- **Base State (Piece Selection):** Default layout primed for piece or pawn file selection.
- **Secondary Menu State:** Alternate keyboard layer functioning like a punctuation toggle to access castling and annotations.
- **Destination State:** Contextual grid emphasizing legal files/ranks after a piece is selected.
- **Ambiguity State:** Specialized overlay to resolve duplicate piece destinations (e.g., Nbd7).
- **Promotion State:** Modal replacing the grid when a pawn reaches the 1st/8th rank.

---

## Key Flows

**Standard Move Entry:** Power user inputs a standard piece move.

1. User is on Base State -> sees highlighted Pieces (N, B, R, Q, K) and Files (a-h).
2. User taps `N` -> Keyboard shifts to Destination State, dimming invalid squares.
3. User taps `f` then `3` -> Move `Nf3` registers, keyboard resets to Base State.

**Capture with Ambiguity:** Power user inputs a capture where two identical pieces can make the move.

1. User is on Base State -> taps `R`.
2. User taps `x` (capture) -> keyboard highlights valid destination squares.
3. User taps `d`, then `4`. System detects ambiguity.
4. UI transitions to Ambiguity State -> highlights originating files/ranks (e.g., `a` or `1`).
5. User taps `1` -> Move `R1xd4` registers.

---

<details>
<summary>Design System</summary>

## Color Palette

- **Primary:** `#00F0FF` - Electric blue for active selection, active legal files/ranks
- **Background:** `#0B1014` - Deep slate app background
- **Surface:** `#1A222C` - Keyboard keys, secondary containers
- **Text:** `#F8FAFC` - Primary typography, key labels
- **Muted:** `#334155` - Inactive keys, borders, invalid options
- **Accent:** `#39FF14` - Bright green for prominent capture (`x`) keys
- **Critical:** `#FF2A2A` - Invalid move warning

## Typography

Choose fonts that are **distinctive and characterful**, emphasizing precision and data processing.

- **Headings (Current Move):** `JetBrains Mono`, 700, 32px
- **Key Labels (Pieces/Letters):** `Space Grotesk`, 600, 24px
- **Small text (Labels):** `Space Grotesk`, 500, 12px
- **Buttons (Actions):** `Space Grotesk`, 700, 16px

**Style notes:** 4px border radius on all keys. 1px solid borders (`#334155`) instead of drop shadows. Active states use inner neon glows (`inset 0 0 8px rgba(0, 240, 255, 0.3)`).

## Design Tokens

```css
:root {
  --color-primary: #00f0ff;
  --color-background: #0b1014;
  --color-surface: #1a222c;
  --color-text: #f8fafc;
  --color-muted: #334155;
  --color-accent: #39ff14;
  --font-primary: 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius: 4px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
}
```

</details>

---

<details>
<summary>Screen Specifications</summary>

### Base State (Piece Selection)

**Purpose:** Initial keyboard state waiting for the first character of a move.

**Layout:**

- Top: 60px height SAN readout display
- Middle: 5x2 grid for Pieces (N, B, R, Q, K) and Actions (prominent `x` key, Secondary Menu toggle)
- Bottom: 4x4 grid split into Files (a-h) and Ranks (1-8)

**Key Elements:**

- **SAN Readout:** Monospace, `#00F0FF` text, blinking block cursor
- **Piece Keys:** 48px height, `#1A222C` surface, white text. Tapping selects the piece. Reversed frequency order (N, B, R, Q, K).
- **Takes Key (x):** Prominently sized for quick pawn captures, uses accent color.
- **Pawn Keys (Files a-h):** Bottom left, defaults to primary brightness as pawns are most common.

**States:**

- **Empty:** Blinking cursor in readout. All keys at standard opacity.
- **Loading:** N/A (local input).
- **Error:** Flash background `#FF2A2A` for 200ms if invalid start character is forced.

**Components:**

- **Standard Key:** 48px height, `#1A222C` bg, 1px `#334155` border, 24px centered text.

**Interactions:**

- **Click [Piece/File]:** Key lights up `#00F0FF`, keyboard shifts to Destination State.
- **Click [Secondary Toggle]:** Shifts action layout to the Secondary Menu State for castling.

**Responsive:**

- **Mobile:** Fills bottom 45% of screen. Keys scale to viewport width.

### Secondary Menu State

**Purpose:** Contextual layer for specialized moves, functioning like a punctuation layer on a standard mobile keyboard.

**Layout:**

- Same overall grid structure as Base State, swapping the action keys for secondary operations.

**Key Elements:**

- **Action Keys:** `O-O` (Kingside), `O-O-O` (Queenside), `+` (Check), `#` (Checkmate), and annotation symbols (`!`, `?`, `!?`, `?!`) prominently displayed in that order.
- **Primary Toggle:** Bottom or side key to return to the standard letter/piece layer.

**Components:**

- **Standard Key:** 48px height, `#1A222C` bg, 1px `#334155` border, 24px centered text.

**Interactions:**

- **Click [Action Key]:** Appends the selected move or symbol to the readout, auto-returns to Base State.
- **Click [Primary Toggle]:** Returns to Base State without inputting a move.

### Destination State

**Purpose:** Filters inputs to show only valid destination coordinates for the selected piece.

**Layout:** Same grid structure as Base State, but visual hierarchy shifts dramatically.

**Key Elements:**

- **Selected Piece Key:** Locked in active state (`#00F0FF` border, text, and inner glow).
- **Valid Files/Ranks:** Bright `#F8FAFC` text, `#1A222C` surface.
- **Invalid Files/Ranks:** Dimmed to 20% opacity, unclickable.

**Components:**

- **Active Key:** `border-color: #00F0FF`, `box-shadow: inset 0 0 8px rgba(0, 240, 255, 0.3)`

**Interactions:**

- **Click [Valid Square]:** Appends to readout, evaluates complete move, returns to Base State if complete.
- **Click [Selected Piece]:** Deselects, returns to Base State.

### Ambiguity State

**Purpose:** Resolves which piece is moving when multiple of the same type can reach the target square.

**Layout:** Overlays the standard grid with a stark, focused selection prompt.

**Key Elements:**

- **Prompt Banner:** 32px height, full width, centered text "RESOLVE AMBIGUITY", `#00F0FF` background, `#0B1014` text.
- **Disambiguation Keys:** Only the specific files (e.g., `a`, `f`) or ranks (e.g., `1`, `8`) of the originating pieces are displayed. All other keys are hidden (opacity 0).

**Interactions:**

- **Click [Disambiguator]:** Inserts letter/number after piece (e.g., changes `N` to `Nf`), auto-progresses to destination completion.

### Promotion State

**Purpose:** Fast, distinct UI for pawn promotion selection.

**Layout:** Replaces the entire lower keyboard grid with a centered 2x2 grid of massive buttons.

**Key Elements:**

- **Promotion Grid:** 4 large square buttons (Q, R, B, N) taking up 80% of keyboard area.
- **Queen Button:** Top-left, defaults to subtle `#00F0FF` highlight as it's the 99% use case.

**Components:**

- **Promo Button:** 80x80px minimum, 32px text.

**Interactions:**

- **Click [Piece]:** Appends `=Q` (or selected piece) to move string, registers move, resets to Base State.

</details>

---

<details>
<summary>Build Guide</summary>

**Stack:** HTML + Tailwind CSS v4

**Build Order:**

1. **Base State** - Establishes the exact dimensions of the grid, key components, and typography. Crucial for getting the tactile "HUD" feel right before adding logic.
2. **Secondary Menu State** - Implements the punctuation-layer toggle behavior for castling and annotation actions.
3. **Destination State** - Implements the opacity/dimming logic and active neon states.
4. **Ambiguity State** - Introduces overlay/hiding logic for conditional rendering.
5. **Promotion State** - Handles the complete layout swap.

</details>
