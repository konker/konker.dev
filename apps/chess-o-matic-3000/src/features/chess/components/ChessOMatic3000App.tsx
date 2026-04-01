import '../chess-o-matic.css';

import { Binary, FileText, Grid3x3, NotebookPen, SlidersHorizontal } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

import type { GameMetadataData } from '../../../domain/game/metadata';
import type { GameEngine, GameEngineUiState } from '../../../game-engine';
import { createGameEngine, GAME_ENGINE_UI_STATE_EMPTY } from '../../../game-engine';
import { GAME_MODEL_EVALUATE_STATUS_IGNORE } from '../../../game-model/evaluate';
import { AppMenu } from './AppMenu';
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
  readonly onConsumeRouteAction?: () => void;
  readonly onGoToHistory?: () => void;
  readonly requestedGameId?: string;
  readonly requestNewGame?: boolean;
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

      if (props.requestedGameId) {
        await gameEngine.loadSavedGame(props.requestedGameId);
        props.onConsumeRouteAction?.();
      } else if (props.requestNewGame) {
        await gameEngine.newGame();
        props.onConsumeRouteAction?.();
      }

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
      updateStatusMessage(gameEngine.isAudioInputOn() ? 'Listening for moves' : 'Voice input paused');
    } catch (error) {
      syncAudioState();
      const message = error instanceof Error ? error.message : 'Unknown speech input error';
      updateStatusMessage(`Speech input unavailable. ${message}`);
    }
  }

  async function toggleSound(): Promise<void> {
    try {
      await gameEngine.audioOutputToggle();
      syncAudioState();
      updateStatusMessage(gameEngine.isAudioOutputOn() ? 'Move sounds enabled' : 'Move sounds muted');
    } catch (error) {
      syncAudioState();
      const message = error instanceof Error ? error.message : 'Unknown audio output error';
      updateStatusMessage(`Audio output unavailable. ${message}`);
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
    return <p class="error-banner">{message()}</p>;
  }

  function handleMetadataChange(metadata: GameMetadataData): void {
    gameEngine.setGameMetadata(metadata);
  }

  function updateStatusMessage(message: string): void {
    setUiState((state) => ({
      ...state,
      lastInputResultMessage: message,
    }));
  }

  function renderCurrentMoveNumber(): number {
    return Math.max(1, Math.ceil(uiState().currentPly / 2));
  }

  function renderCurrentMoveColor(): 'white' | 'black' {
    return uiState().currentPly % 2 === 0 ? 'white' : 'black';
  }

  async function startNewGame(): Promise<void> {
    try {
      await gameEngine.newGame();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown new game error';
      updateStatusMessage(`Unable to start a new game. ${message}`);
    }
  }

  async function discardCurrentGame(): Promise<void> {
    try {
      await gameEngine.discardGame();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown discard game error';
      updateStatusMessage(`Unable to discard the current game. ${message}`);
    }
  }

  async function openInLichess(): Promise<void> {
    try {
      await gameEngine.openGameInLichess();
      updateStatusMessage('Copied PGN and opened Lichess');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Lichess open error';
      updateStatusMessage(`Unable to open Lichess. ${message}`);
    }
  }

  async function openInChessDotCom(): Promise<void> {
    try {
      await gameEngine.openGameInChessDotCom();
      updateStatusMessage('Copied PGN and opened Chess.com');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Chess.com open error';
      updateStatusMessage(`Unable to open Chess.com. ${message}`);
    }
  }

  return (
    <main class="app-shell">
      <header class="app-header">
        <div class="app-header-top">
          <div class="flex flex-col gap-2">
            <span class="app-eyebrow">Voice-first chess recorder</span>
            <h1 class="app-title flex items-center gap-1">
              <img alt="" aria-hidden="true" class="h-10 w-10 shrink-0 sm:h-12 sm:w-12" src="/images/rook.cobalt.svg" />
              <span>Chess-o-matic 3000</span>
            </h1>
          </div>
          <AppMenu
            onGoToHistory={() => props.onGoToHistory?.()}
            onNewGame={() => {
              void startNewGame();
            }}
          />
        </div>
        <p class="app-subtitle"></p>
      </header>

      <Show when={errorMessage()}>{renderErrorMessage}</Show>

      <StatusPanel
        controls={
          <ControlsPanel
            disabled={isInitializing() || !!errorMessage()}
            isListeningAvailable={isListeningAvailable()}
            isListening={isListening()}
            isSoundAvailable={isSoundAvailable()}
            isSoundEnabled={isSoundEnabled()}
            onToggleListening={() => void toggleListening()}
            onToggleSound={() => void toggleSound()}
          />
        }
        lastMoveSan={uiState().lastMoveSan}
        message={uiState().lastInputResultMessage}
        sanitizedInput={uiState().lastInputSanitized}
        status={uiState().lastInputEvaluateStatus}
      />

      <CollapsibleSection
        headerAside={
          <>
            <span class="status-chip status-move-chip">{renderCurrentMoveNumber()}</span>
            <span
              aria-label={`${renderCurrentMoveColor()} to move`}
              class={`status-color-chip status-color-chip-${renderCurrentMoveColor()}`}
            />
          </>
        }
        icon={Grid3x3}
        open
        storageKey="board"
        title="Board"
      >
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

      <section aria-label="Navigation" class="app-control-zone">
        <div class="app-control-row">
          <GameNavigationPanel
            canGoBackward={uiState().canGoBackward}
            canGoForward={uiState().canGoForward}
            disabled={isInitializing() || !!errorMessage()}
            onGoToEnd={() => gameEngine.goToEnd()}
            onGoToStart={() => gameEngine.goToStart()}
            onStepBackward={() => gameEngine.stepBackward()}
            onStepForward={() => gameEngine.stepForward()}
          />
        </div>
      </section>

      <CollapsibleSection icon={SlidersHorizontal} open storageKey="info" title="Info">
        <GameMetadata metadata={uiState().gameMetadata} onMetadataChange={handleMetadataChange} />
      </CollapsibleSection>

      <CollapsibleSection icon={NotebookPen} open storageKey="scoresheet" title="Scoresheet">
        <ScoreSheet
          currentPly={uiState().currentPly}
          onGoToPly={gameEngine.goToPly}
          scoresheet={uiState().scoresheetData}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={FileText} storageKey="pgn" title="PGN">
        <PgnPanel
          currentPly={uiState().currentPly}
          disabled={isInitializing() || !!errorMessage()}
          onOpenChessDotCom={() => void openInChessDotCom()}
          onOpenLichess={() => void openInLichess()}
          onGoToPly={gameEngine.goToPly}
          pgn={uiState().pgn}
          pgnMoveList={uiState().pgnMoveList}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={Binary} storageKey="fen" title="FEN">
        <FenPanel fen={uiState().fen} />
      </CollapsibleSection>

      <footer class="app-footer">
        <span>Chess-o-matic 3000</span>
        <span>Design system in progress</span>
      </footer>
    </main>
  );
}
