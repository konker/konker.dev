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
import { ScoreSheet } from './ScoreSheet';
import type { ScoreSheetData } from './ScoreSheet/types';
import { SCORESHEET_EMPTY } from './ScoreSheet/types';

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
  const [scoresheetData, setScoresheetData] = createSignal<ScoreSheetData>(SCORESHEET_EMPTY);

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
          setScoresheetData(state.scoresheetData);
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

  function renderStatusClasses(): string {
    switch (lastInputEvaluateStatus()) {
      case 'ok':
        return 'border-l-green-700';
      case 'illegal':
        return 'border-l-red-600';
      case 'control':
        return 'border-l-blue-600';
      case 'ignore':
      default:
        return 'border-l-amber-700';
    }
  }

  return (
    <main class="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-3">
      <h1>Chess-o-Matic</h1>

      <Show when={errorMessage()}>{renderErrorMessage}</Show>

      <div
        class={`flex flex-col gap-2 rounded-lg border border-slate-300 border-l-[0.75rem] bg-slate-50 px-4 py-3 ${renderStatusClasses()}`}
        data-status={lastInputEvaluateStatus()}
        id="status"
      >
        <div class="flex justify-between gap-4 text-sm text-slate-600">
          <span>Status</span>
          <span aria-label="Last Input Evaluate Status">{lastInputEvaluateStatus()}</span>
        </div>
        <div aria-label="Last Input SAN" class="text-2xl font-bold leading-tight">
          {renderLastMoveSan()}
        </div>
        <div aria-label="Last Input Message" class="text-base leading-6">
          {lastInputResultMessage()}
        </div>
        <div class="flex flex-col gap-1 text-sm text-slate-600">
          <span>Heard</span>
          <span aria-label="Last Input Sanitized">{renderLastInputSanitized()}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <button disabled={isInitializing() || !!errorMessage()} onClick={() => void toggleListening()} type="button">
          {isListening() ? 'Disable Audio Input' : 'Enable Audio Input'}
        </button>

        <button disabled={isInitializing() || !!errorMessage()} onClick={() => void toggleSound()} type="button">
          {isSoundEnabled() ? 'Disable Audio Output' : 'Enable Audio Output'}
        </button>
      </div>

      <ScoreSheet scoresheet={scoresheetData()} />

      <ChessBoard
        fen={fen()}
        getPromotionPieceColor={gameEngine.getPromotionPieceColor}
        isLegalMove={gameEngine.isLegalMove}
        onMove={gameEngine.handleBoardMove}
        onReady={(controller) => void setBoardController(controller)}
      />

      <label class="flex flex-col gap-2">
        <span>PGN</span>
        <textarea aria-label="PGN" class="min-h-32 w-full resize-y" readOnly value={pgn()} />
      </label>

      <label class="flex flex-col gap-2">
        <span>FEN</span>
        <div aria-label="FEN">{fen()}</div>
      </label>
    </main>
  );
}
