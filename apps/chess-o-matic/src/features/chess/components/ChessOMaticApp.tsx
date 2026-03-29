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
import { ControlsPanel } from './ControlsPanel';
import { FenPanel } from './FenPanel';
import { GameMetadata } from './GameMetadata';
import type { GameMetadataData } from './GameMetadata/types';
import { GAME_METADATA_EMPTY } from './GameMetadata/types';
import { PgnPanel } from './PgnPanel';
import { ScoreSheet } from './ScoreSheet';
import type { ScoreSheetData } from './ScoreSheet/types';
import { SCORESHEET_EMPTY } from './ScoreSheet/types';
import { StatusPanel } from './StatusPanel';

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
  const [gameMetadata, setGameMetadata] = createSignal<GameMetadataData>(GAME_METADATA_EMPTY);

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

  function handleMetadataChange(metadata: GameMetadataData): void {
    setGameMetadata(metadata);
    gameEngine.setGameMetadata(metadata);
  }

  return (
    <main class="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-3">
      <h1>Chess-o-Matic</h1>

      <Show when={errorMessage()}>{renderErrorMessage}</Show>

      <StatusPanel
        lastMoveSan={lastMoveSan()}
        message={lastInputResultMessage()}
        sanitizedInput={lastInputSanitized()}
        status={lastInputEvaluateStatus()}
      />

      <ControlsPanel
        disabled={isInitializing() || !!errorMessage()}
        isListening={isListening()}
        isSoundEnabled={isSoundEnabled()}
        onToggleListening={() => void toggleListening()}
        onToggleSound={() => void toggleSound()}
      />

      <GameMetadata metadata={gameMetadata()} onMetadataChange={handleMetadataChange} />

      <ScoreSheet scoresheet={scoresheetData()} />

      <ChessBoard
        fen={fen()}
        getPromotionPieceColor={gameEngine.getPromotionPieceColor}
        isLegalMove={gameEngine.isLegalMove}
        onMove={gameEngine.handleBoardMove}
        onReady={(controller) => void setBoardController(controller)}
      />

      <PgnPanel pgn={pgn()} />

      <FenPanel fen={fen()} />
    </main>
  );
}
