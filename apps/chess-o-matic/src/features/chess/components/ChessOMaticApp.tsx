import '../chess-o-matic.css';

import type { JSX } from 'solid-js';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

import type { GameEngine } from '../../../game-engine';
import { createGameEngine } from '../../../game-engine';
import { START_FEN } from '../../../game-model/consts';
import type { GameModelEvaluateStatus } from '../../../game-model/evaluate';
import { GAME_MODEL_EVALUATE_STATUS_IGNORE } from '../../../game-model/evaluate';
import { ChessBoard } from './ChessBoard';
import type { ChessBoardController } from './ChessBoard/controller';

type ChessOMaticAppProps = {
  readonly autoloadEngine?: boolean;
};

export function ChessOMaticApp(props: ChessOMaticAppProps): JSX.Element {
  const [errorMessage, setErrorMessage] = createSignal<string>();
  const [lastInputResultMessage, setLastInputResultMessage] = createSignal('Loading local speech model…');
  const [isInitializing, setIsInitializing] = createSignal(true);
  const [isListening, setIsListening] = createSignal(false);
  const [isSoundEnabled, setIsSoundEnabled] = createSignal(false);
  const [lastInputEvaluateStatus, setLastInputEvaluateStatus] = createSignal<GameModelEvaluateStatus>(
    GAME_MODEL_EVALUATE_STATUS_IGNORE
  );
  const [lastInputSanitized, setLastInputSanitized] = createSignal('');
  const [lastMoveSan, setLastMoveSan] = createSignal('');
  const [fen, setFen] = createSignal(START_FEN);
  const [pgn, setPgn] = createSignal('');
  const [scoresheet, setScoresheet] = createSignal<unknown>({});

  const gameEngine: GameEngine = createGameEngine();

  function syncAudioState(): void {
    setIsListening(gameEngine.isAudioInputOn());
    setIsSoundEnabled(gameEngine.isAudioOutputOn());
  }

  onMount(async () => {
    if (props.autoloadEngine === false) {
      setIsInitializing(false);
      setLastInputResultMessage('Component test mode');
      setLastInputEvaluateStatus(GAME_MODEL_EVALUATE_STATUS_IGNORE);
      return;
    }

    try {
      await gameEngine.init({
        initialSettings: {
          audioInputOn: true,
          audioOutputOn: false,
        },
        onUiStateChange: (state) => {
          setLastInputSanitized(state.lastInputSanitized);
          setLastMoveSan(state.lastMoveSan);
          setLastInputEvaluateStatus(state.lastInputEvaluateStatus);
          setLastInputResultMessage(state.lastInputResultMessage);
          setFen(state.fen);
          setPgn(state.pgn);
          setScoresheet(state.scoresheet);
        },
      });

      syncAudioState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown initialization error';
      setErrorMessage(
        `Unable to initialize Chess-o-Matic. Add the local Vosk model to public/models/vosk-model-small-en-us-0.15.zip and retry. (${message})`
      );
      setLastInputEvaluateStatus(GAME_MODEL_EVALUATE_STATUS_IGNORE);
      setLastInputResultMessage('Initialization failed');
    } finally {
      setIsInitializing(false);
    }
  });

  onCleanup(() => {
    void gameEngine.exit();
  });

  async function toggleListening(): Promise<void> {
    await gameEngine.audioInputToggle();
    syncAudioState();
    setLastInputResultMessage(gameEngine.isAudioInputOn() ? 'Listening for moves' : 'Voice input paused');
  }

  async function toggleSound(): Promise<void> {
    await gameEngine.audioOutputToggle();
    syncAudioState();
    setLastInputResultMessage(gameEngine.isAudioOutputOn() ? 'Move sounds enabled' : 'Move sounds muted');
  }

  async function setBoardController(controller: ChessBoardController | undefined): Promise<void> {
    try {
      await gameEngine.attachBoardController(controller);
      syncAudioState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown board controller error';
      setErrorMessage(`The chess board failed to initialize. (${message})`);
    }
  }

  function renderErrorMessage(message: () => string): JSX.Element {
    return <p>{message()}</p>;
  }

  function renderLastMoveSan(): string {
    return lastMoveSan() || 'No move yet';
  }

  function renderLastInputSanitized(): string {
    return lastInputSanitized() || 'No input yet';
  }

  return (
    <main class="app-shell">
      <h1>Chess-o-Matic</h1>

      <Show when={errorMessage()}>{renderErrorMessage}</Show>

      <div data-status={lastInputEvaluateStatus()} id="status">
        <div class="status-meta">
          <span>Status</span>
          <span aria-label="Last Input Evaluate Status">{lastInputEvaluateStatus()}</span>
        </div>
        <div class="status-primary" aria-label="Last Input SAN">
          {renderLastMoveSan()}
        </div>
        <div class="status-message" aria-label="Last Input Message">
          {lastInputResultMessage()}
        </div>
        <div class="status-secondary">
          <span>Heard</span>
          <span aria-label="Last Input Sanitized">{renderLastInputSanitized()}</span>
        </div>
      </div>

      <div class="button-row">
        <button disabled={isInitializing() || !!errorMessage()} onClick={() => void toggleListening()} type="button">
          {isListening() ? 'Disable Audio Input' : 'Enable Audio Input'}
        </button>

        <button disabled={isInitializing() || !!errorMessage()} onClick={() => void toggleSound()} type="button">
          {isSoundEnabled() ? 'Disable Audio Output' : 'Enable Audio Output'}
        </button>
      </div>

      <div id="scoresheet">{JSON.stringify(scoresheet())}</div>

      <ChessBoard
        fen={fen()}
        getPromotionPieceColor={gameEngine.getPromotionPieceColor}
        isLegalMove={gameEngine.isLegalMove}
        onMove={gameEngine.handleBoardMove}
        onReady={(controller) => void setBoardController(controller)}
      />

      <label class="field">
        <span>PGN</span>
        <textarea aria-label="PGN" readOnly value={pgn()} />
      </label>

      <label class="field">
        <span>FEN</span>
        <div aria-label="FEN">{fen()}</div>
      </label>
    </main>
  );
}
