import '../chess-o-matic.css';

import { Binary, FileText, Grid3x3, NotebookPen, SlidersHorizontal } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

import type { GameMetadataData } from '../../../domain/game/metadata';
import type { GameEngine, GameEngineUiState } from '../../../game-engine';
import { createGameEngine, GAME_ENGINE_UI_STATE_EMPTY } from '../../../game-engine';
import { GAME_MODEL_EVALUATE_STATUS_IGNORE } from '../../../game-model/evaluate';
import { ChessBoard } from './ChessBoard';
import type { ChessBoardController } from './ChessBoard/controller';
import { CollapsibleSection } from './CollapsibleSection';
import { ControlsPanel } from './ControlsPanel';
import { FenPanel } from './FenPanel';
import { GameMetadata } from './GameMetadata';
import { GameNavigationPanel } from './GameNavigationPanel';
import { PgnPanel } from './PgnPanel';
import { ScoreSheet } from './ScoreSheet';
import { StatusPanel } from './StatusPanel';

type ChessOMaticAppProps = {
  readonly autoloadEngine?: boolean;
};

export function ChessOMatic3000App(props: ChessOMaticAppProps): JSX.Element {
  const [errorMessage, setErrorMessage] = createSignal<string>();
  const [isInitializing, setIsInitializing] = createSignal(true);
  const [isListening, setIsListening] = createSignal(false);
  const [isListeningAvailable, setIsListeningAvailable] = createSignal(false);
  const [isSoundEnabled, setIsSoundEnabled] = createSignal(false);
  const [isSoundAvailable, setIsSoundAvailable] = createSignal(false);
  const [uiState, setUiState] = createSignal<GameEngineUiState>({
    ...GAME_ENGINE_UI_STATE_EMPTY,
    lastInputResultMessage: 'Starting app…',
  });

  const gameEngine: GameEngine = createGameEngine();

  function syncAudioState(): void {
    setIsListeningAvailable(gameEngine.canUseAudioInput());
    setIsListening(gameEngine.isAudioInputOn());
    setIsSoundAvailable(gameEngine.canUseAudioOutput());
    setIsSoundEnabled(gameEngine.isAudioOutputOn());
  }

  onMount(async () => {
    if (props.autoloadEngine === false) {
      setIsInitializing(false);
      setUiState((state) => ({
        ...state,
        lastInputEvaluateStatus: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        lastInputResultMessage: 'Component test mode',
      }));
      return;
    }

    try {
      await gameEngine.init({
        initialSettings: {
          audioInputOn: false,
          audioOutputOn: false,
        },
        onUiStateChange: (state) => {
          setUiState(state);
        },
      });

      syncAudioState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown initialization error';
      setErrorMessage(`Unable to initialize Chess-o-matic 3000. (${message})`);
      setUiState((state) => ({
        ...state,
        lastInputEvaluateStatus: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        lastInputResultMessage: 'Initialization failed',
      }));
    } finally {
      setIsInitializing(false);
    }
  });

  onCleanup(() => {
    void gameEngine.exit();
  });

  async function toggleListening(): Promise<void> {
    try {
      await gameEngine.audioInputToggle();
      syncAudioState();
      setUiState((state) => ({
        ...state,
        lastInputEvaluateStatus: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        lastInputResultMessage: gameEngine.isAudioInputOn() ? 'Listening for moves' : 'Voice input paused',
      }));
    } catch (error) {
      syncAudioState();
      const message = error instanceof Error ? error.message : 'Unknown speech input error';
      setUiState((state) => ({
        ...state,
        lastInputEvaluateStatus: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        lastInputResultMessage: `Speech input unavailable. ${message}`,
      }));
    }
  }

  async function toggleSound(): Promise<void> {
    try {
      await gameEngine.audioOutputToggle();
      syncAudioState();
      setUiState((state) => ({
        ...state,
        lastInputEvaluateStatus: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        lastInputResultMessage: gameEngine.isAudioOutputOn() ? 'Move sounds enabled' : 'Move sounds muted',
      }));
    } catch (error) {
      syncAudioState();
      const message = error instanceof Error ? error.message : 'Unknown audio output error';
      setUiState((state) => ({
        ...state,
        lastInputEvaluateStatus: GAME_MODEL_EVALUATE_STATUS_IGNORE,
        lastInputResultMessage: `Audio output unavailable. ${message}`,
      }));
    }
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
    gameEngine.setGameMetadata(metadata);
  }

  return (
    <main class="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-3">
      <h1>Chess-o-matic 3000</h1>

      <Show when={errorMessage()}>{renderErrorMessage}</Show>

      <StatusPanel
        lastMoveSan={uiState().lastMoveSan}
        message={uiState().lastInputResultMessage}
        sanitizedInput={uiState().lastInputSanitized}
        status={uiState().lastInputEvaluateStatus}
      />

      <div class="flex flex-wrap items-start justify-between gap-3">
        <GameNavigationPanel
          canGoBackward={uiState().canGoBackward}
          canGoForward={uiState().canGoForward}
          disabled={isInitializing() || !!errorMessage()}
          onGoToEnd={() => gameEngine.goToEnd()}
          onGoToStart={() => gameEngine.goToStart()}
          onStepBackward={() => gameEngine.stepBackward()}
          onStepForward={() => gameEngine.stepForward()}
        />

        <ControlsPanel
          disabled={isInitializing() || !!errorMessage()}
          isListeningAvailable={isListeningAvailable()}
          isListening={isListening()}
          isSoundAvailable={isSoundAvailable()}
          isSoundEnabled={isSoundEnabled()}
          onToggleListening={() => void toggleListening()}
          onToggleSound={() => void toggleSound()}
        />
      </div>

      <CollapsibleSection icon={SlidersHorizontal} open title="Info">
        <GameMetadata metadata={uiState().gameMetadata} onMetadataChange={handleMetadataChange} />
      </CollapsibleSection>

      <CollapsibleSection icon={NotebookPen} open title="Scoresheet">
        <ScoreSheet
          currentPly={uiState().currentPly}
          onGoToPly={gameEngine.goToPly}
          scoresheet={uiState().scoresheetData}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={Grid3x3} open title="Board">
        <ChessBoard
          fen={uiState().fen}
          getPromotionPieceColor={gameEngine.getPromotionPieceColor}
          isLegalMove={gameEngine.isLegalMove}
          onMove={gameEngine.handleBoardMove}
          onReady={(controller) => void setBoardController(controller)}
          onToggleOrientation={() => gameEngine.toggleBoardOrientation()}
          orientation={uiState().boardOrientation}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={FileText} title="PGN">
        <PgnPanel
          currentPly={uiState().currentPly}
          onGoToPly={gameEngine.goToPly}
          pgn={uiState().pgn}
          pgnMoveList={uiState().pgnMoveList}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={Binary} title="FEN">
        <FenPanel fen={uiState().fen} />
      </CollapsibleSection>
    </main>
  );
}
