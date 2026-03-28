import '../chess-o-matic.css';

import { createSignal, onCleanup, onMount } from 'solid-js';

type ChessEngineModule = typeof import('../../../game-engine');

type ChessOMaticAppProps = {
  readonly autoloadEngine?: boolean;
};

export function ChessOMaticApp(props: ChessOMaticAppProps) {
  let boardEl: HTMLElement | undefined;
  let inputEl: HTMLParagraphElement | undefined;
  let pgnEl: HTMLPreElement | undefined;
  let promotionDialogEl: HTMLDivElement | undefined;

  const [errorMessage, setErrorMessage] = createSignal<string>();
  const [isInitializing, setIsInitializing] = createSignal(true);
  const [isListening, setIsListening] = createSignal(false);
  const [isSoundEnabled, setIsSoundEnabled] = createSignal(false);
  const [statusMessage, setStatusMessage] = createSignal('Loading local speech model…');

  let gameEngine: ChessEngineModule | undefined;

  const syncAudioState = () => {
    if (!gameEngine) {
      return;
    }

    setIsListening(gameEngine.gameEngineIsAudioInputOn());
    setIsSoundEnabled(gameEngine.gameEngineIsAudioOutputOn());
  };

  onMount(async () => {
    if (props.autoloadEngine === false) {
      setIsInitializing(false);
      setStatusMessage('Component test mode');
      return;
    }

    if (!boardEl || !inputEl || !pgnEl || !promotionDialogEl) {
      setErrorMessage('The chess board failed to mount.');
      setIsInitializing(false);
      return;
    }

    try {
      gameEngine = await import('../../../game-engine');
      await gameEngine.gameEngineInit({
        boardEl,
        inputEl,
        pgnEl,
        promotionDialogEl,
        initialSettings: {
          audioInputOn: true,
          audioOutputOn: false,
        },
      });

      syncAudioState();
      setStatusMessage('Ready for voice input');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown initialization error';
      setErrorMessage(
        `Unable to initialize Chess-o-Matic. Add the local Vosk model to public/models/vosk-model-small-en-us-0.15.zip and retry. (${message})`
      );
      setStatusMessage('Initialization failed');
    } finally {
      setIsInitializing(false);
    }
  });

  onCleanup(() => {
    if (gameEngine) {
      void gameEngine.gameEngineExit();
    }
  });

  const toggleListening = async () => {
    if (!gameEngine) {
      return;
    }

    await gameEngine.gameEngineAudioInputToggle();
    syncAudioState();
    setStatusMessage(gameEngine.gameEngineIsAudioInputOn() ? 'Listening for moves' : 'Voice input paused');
  };

  const toggleSound = async () => {
    if (!gameEngine) {
      return;
    }

    await gameEngine.gameEngineAudioOutputToggle();
    syncAudioState();
    setStatusMessage(gameEngine.gameEngineIsAudioOutputOn() ? 'Move sounds enabled' : 'Move sounds muted');
  };

  return (
    <main class="app-shell">
      <h1>Chess-o-Matic</h1>

      <p>|{errorMessage() ? <p>{errorMessage()}</p> : null}|</p>

      <div class="button-row">
        <button kdisabled={isInitializing() || !!errorMessage()} onClick={() => void toggleListening()} type="button">
          {isListening() ? 'Disable Audio Input' : 'Enable Audio Input'}
        </button>

        <button kdisabled={isInitializing() || !!errorMessage()} onClick={() => void toggleSound()} type="button">
          {isSoundEnabled() ? 'Disable Audio Output' : 'Enable Audio Output'}
        </button>
      </div>
      <div class="board-frame">
        <g-chess-board class="board" id="board" ref={boardEl} />
        <div class="promotion-dialog" data-open="false" id="promotion-dialog" ref={promotionDialogEl}>
          <div class="promotion-panel">
            <button class="promo-choice" data-piece="q" title="Queen" type="button" />
            <button class="promo-choice" data-piece="r" title="Rook" type="button" />
            <button class="promo-choice" data-piece="b" title="Bishop" type="button" />
            <button class="promo-choice" data-piece="n" title="Knight" type="button" />
          </div>
        </div>
      </div>
      <label class="field">
        <span>PGN</span>
        <textarea aria-label="PGN" readOnly ref={pgnEl}>
          No moves yet.
        </textarea>
      </label>
      <label class="field">
        <span>Last Input / Result</span>
        <textarea aria-label="Last Input / Result" readOnly ref={inputEl}>
          {statusMessage()}
        </textarea>
      </label>
    </main>
  );
}
