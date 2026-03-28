import '../chess-o-matic.css';

import type { JSX } from 'solid-js';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

import type { GameEngine } from '../../../game-engine';
import { createGameEngine } from '../../../game-engine';
import { ChessBoard } from './ChessBoard';

type ChessOMaticAppProps = {
  readonly autoloadEngine?: boolean;
};

export function ChessOMaticApp(props: ChessOMaticAppProps): JSX.Element {
  let boardEl: HTMLElement | undefined;
  let promotionDialogEl: HTMLDivElement | undefined;

  const [errorMessage, setErrorMessage] = createSignal<string>();
  const [isInitializing, setIsInitializing] = createSignal(true);
  const [isListening, setIsListening] = createSignal(false);
  const [isSoundEnabled, setIsSoundEnabled] = createSignal(false);
  const [lastInputResult, setLastInputResult] = createSignal('Loading local speech model…');
  const [pgn, setPgn] = createSignal('No moves yet.');

  let gameEngine: GameEngine | undefined;

  function syncAudioState(): void {
    if (!gameEngine) {
      return;
    }

    setIsListening(gameEngine.isAudioInputOn());
    setIsSoundEnabled(gameEngine.isAudioOutputOn());
  }

  onMount(async () => {
    if (props.autoloadEngine === false) {
      setIsInitializing(false);
      setLastInputResult('Component test mode');
      return;
    }

    if (!boardEl || !promotionDialogEl) {
      setErrorMessage('The chess board failed to mount.');
      setIsInitializing(false);
      return;
    }

    try {
      gameEngine = createGameEngine();
      await gameEngine.init({
        boardEl,
        promotionDialogEl,
        initialSettings: {
          audioInputOn: true,
          audioOutputOn: false,
        },
        onUiStateChange: (state) => {
          setLastInputResult(state.lastInputResult);
          setPgn(state.pgn);
        },
      });

      syncAudioState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown initialization error';
      setErrorMessage(
        `Unable to initialize Chess-o-Matic. Add the local Vosk model to public/models/vosk-model-small-en-us-0.15.zip and retry. (${message})`
      );
      setLastInputResult('Initialization failed');
    } finally {
      setIsInitializing(false);
    }
  });

  onCleanup(() => {
    if (gameEngine) {
      void gameEngine.exit();
    }
  });

  async function toggleListening(): Promise<void> {
    if (!gameEngine) {
      return;
    }

    await gameEngine.audioInputToggle();
    syncAudioState();
    setLastInputResult(gameEngine.isAudioInputOn() ? 'Listening for moves' : 'Voice input paused');
  }

  async function toggleSound(): Promise<void> {
    if (!gameEngine) {
      return;
    }

    await gameEngine.audioOutputToggle();
    syncAudioState();
    setLastInputResult(gameEngine.isAudioOutputOn() ? 'Move sounds enabled' : 'Move sounds muted');
  }

  function setBoardElement(element: HTMLElement): void {
    boardEl = element;
  }

  function setPromotionDialogElement(element: HTMLDivElement): void {
    promotionDialogEl = element;
  }

  function renderErrorMessage(message: () => string): JSX.Element {
    return <p>{message()}</p>;
  }

  return (
    <main class="app-shell">
      <h1>Chess-o-Matic</h1>

      <Show when={errorMessage()}>{renderErrorMessage}</Show>

      <div class="button-row">
        <button disabled={isInitializing() || !!errorMessage()} onClick={() => void toggleListening()} type="button">
          {isListening() ? 'Disable Audio Input' : 'Enable Audio Input'}
        </button>

        <button disabled={isInitializing() || !!errorMessage()} onClick={() => void toggleSound()} type="button">
          {isSoundEnabled() ? 'Disable Audio Output' : 'Enable Audio Output'}
        </button>
      </div>

      <ChessBoard boardRef={setBoardElement} promotionDialogRef={setPromotionDialogElement} />

      <label class="field">
        <span>Last Input / Result</span>
        <textarea aria-label="Last Input / Result" readOnly value={lastInputResult()} />
      </label>

      <label class="field">
        <span>PGN</span>
        <textarea aria-label="PGN" readOnly value={pgn()} />
      </label>
    </main>
  );
}
