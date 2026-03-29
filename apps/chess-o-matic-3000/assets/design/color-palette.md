# Design System: Color Tokens (v1.0)

This document defines the primary, secondary, and utility color scales for the **Chess-o-matic 3000** application. The palette follows a 7-step scale (100–700) where 100 is the lightest and 700 is the deepest shade.

## Color Scales

### 1. Forest Green (Primary / Success)

Designed for the "Green" squares on a chess board or "Success" states.
| Level | Hex Code | Usage |
| :--- | :--- | :--- |
| 100 | `#DEF9D2` | Light highlights |
| 200 | `#A5D98B` | Subtle UI backgrounds |
| 300 | `#85B06F` | Interactive elements |
| 400 | `#668855` | **Primary Brand Color** |
| 500 | `#49623C` | Dark accents |
| 600 | `#2D3F25` | High contrast text on light |
| 700 | `#151F0F` | Near-black dark mode bg |

### 2. Gold / Olive (Warning)

Designed for "Highlight" squares or active voice-command indicators.
| Level | Hex Code | Usage |
| :--- | :--- | :--- |
| 100 | `#FFFFDD` | Creamy light mode background |
| 400 | `#8C8C00` | Warning/Alert mid-tone |
| 700 | `#242400` | Deepest olive accent |

### 3. Terracotta / Wood (Brown / Secondary)

Designed for a classic "Wooden Board" aesthetic.
| Level | Hex Code | Usage |
| :--- | :--- | :--- |
| 100 | `#F1DBCD` | Light "Wood" square |
| 300 | `#B58863` | **Traditional Brown Square** |
| 700 | `#180F08` | Deep wood shadow |

### 4. Berry / Crimson (Error / Attention)

Designed for error states, illegal moves, or recording "Stop" buttons.
| Level | Hex Code | Usage |
| :--- | :--- | :--- |
| 100 | `#FDE2E9` | Error light bg |
| 400 | `#DD2277` | **Primary Error/Alert** |
| 700 | `#2F0215` | Intense dark mode alert |

### 5. Cobalt / Royal (Accent / Info)

Designed for metadata tags, links, and "Copy" button primary states.
| Level | Hex Code | Usage |
| :--- | :--- | :--- |
| 100 | `#E6ECFD` | Subtle info box bg |
| 400 | `#3378D4` | **Interactive Blue / Links** |
| 700 | `#051730` | Deep navigation bar |

### 6. Neutral / Slate (UI Foundations)

Designed for backgrounds, text, and borders.
| Level | Hex Code | Usage |
| :--- | :--- | :--- |
| 100 | `#EFF1EE` | Page background (Light mode) |
| 400 | `#7C807B` | Secondary text |
| 700 | `#1B1C1B` | Primary text (Light mode) / Background (Dark mode) |

---

## Technical Export (JSON)

For direct implementation in a `theme.json` or CSS-in-JS object:

```json
{
  "theme": {
    "colors": {
      "forest": ["#DEF9D2", "#A5D98B", "#85B06F", "#668855", "#49623C", "#2D3F25", "#151F0F"],
      "gold": ["#FFFFDD", "#DBDB00", "#B3B300", "#8C8C00", "#676700", "#444400", "#242400"],
      "wood": ["#F1DBCD", "#E3AC7F", "#B58863", "#886649", "#5E4531", "#37271A", "#180F08"],
      "berry": ["#FDE2E9", "#FAAAC1", "#F8689B", "#DD2277", "#9F1554", "#640933", "#2F0215"],
      "cobalt": ["#E6ECFD", "#AEC4F8", "#6D9DF3", "#3378D4", "#225599", "#123462", "#051730"],
      "neutral": ["#EFF1EE", "#C7CDC5", "#A1A69F", "#7C807B", "#595C59", "#393B38", "#1B1C1B"]
    }
  }
}
```
