# Chess-o-matic 3000 design and implementation plan

## Purpose

Chess-o-matic 3000 is a mobile-first app whose purpose is to allow speech recording of chess games. Kind of like a "speech aware chess score-sheet". The main input is speech recognition of chess moves. The current state of the game is tracked and displayed in PGN format. The PGN Is the primary output/point of the app. It is expected that this can be saved and will be copied for use in other tools for e.g. game analysis. A visual representation of the game board should be available. The user can optionally enter moves directly into the board if desired, but the app should also function just with voice input, and the board can be optionally hideable. Because the player is mainly focused on a physical chess board, the app should be very readable "at a glance", e.g. if a move is not recognized, there should be noticeable visual indicators and optional audio prompts. It should be obvious at a glance if the last move was a valid move or an invalid move.
In future iterations, standard app furniture may be added, for e.g. login, game history, etc. But for now I want to focus on the main feature UI screen.

## Constraints

- The app should be made available as a web app.
- It should be responsive for both mobile or desktop use.
- It should be compatible with creating a PWA.
- It should be compatible with creating a native mobile app via a web-view framework, e.g. React Native, Flutter, etc.

## UI

The UI should have the following features:

- A "listen" toggle button, using an appropriate SVG icon pair, to control if the webaudio speech recognition is on or off.
- A "mute" toggle button, using an appropriate SVG icon pair, to control if notification and other UI sounds are on or off.
- A "hide board" toggle button, using an appropriate SVG icon pair, to control if the chess board is visible or not.
- A sound scheme for:
  - A move (standard chess move "thock" sound)
  - An illegal or unrecognized move
- A visual feedback element to indicate if the last move was valid or invalid. This could be a green/red border around the main content area, or something else that is easily visible at a glance.
- A status element to show:
  - text of the last input
  - the result of the input, e.g. if it was an illegal move, or an unrecognized input, or a successful move.
- A button, using an appropriate svg icon, to undo.
- A button, using an appropriate svg icon, to redo.
- A button, using an appropriate svg icon, to flip the board.
- A button, using an appropriate svg icon, to reset the game.
- A collapsable form area to enter standard PNG metadata headers, e.g.: Event, Site, Date, White, Black, etc.
  - Editing this form are should immediately update the game mode chess.js instance and be reflected in the PGN output panel.
- A PGN output panel which shows the current PGN for the game model chess.js state.
  - In future, this panel should be improved by allowing the individual moves to be rendered in a more interesting or interactive way, but initially this can be text only.
  - The PGN Panel should be read-only, and always reflect the current state of the game model chess.js instance.
- A copy button, using an appropriate svg icon, to copy the PGN to the clipboard.
