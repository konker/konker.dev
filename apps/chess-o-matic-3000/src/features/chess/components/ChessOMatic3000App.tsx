import '../chess-o-matic.css';

import { Binary, FileText, Grid3x3, NotebookPen, SlidersHorizontal } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

import type { GameEngine } from '../../../game-engine';
import { createGameEngine } from '../../../game-engine';
import { START_FEN } from '../../../game-model/consts';
import type { GameModelEvaluateStatus } from '../../../game-model/evaluate';
import { GAME_MODEL_EVALUATE_STATUS_IGNORE } from '../../../game-model/evaluate';
import { ChessBoard } from './ChessBoard';
import type { ChessBoardController } from './ChessBoard/controller';
import { CollapsibleSection } from './CollapsibleSection';
import { ControlsPanel } from './ControlsPanel';
import { FenPanel } from './FenPanel';
import { GameMetadata } from './GameMetadata';
import type { GameMetadataData } from './GameMetadata/types';
import { GAME_METADATA_EMPTY } from './GameMetadata/types';
import { GameNavigationPanel } from './GameNavigationPanel';
import { PgnPanel } from './PgnPanel';
import type { PgnMoveListData } from './PgnPanel/types';
import { PGN_MOVE_LIST_EMPTY } from './PgnPanel/types';
import { ScoreSheet } from './ScoreSheet';
import type { ScoreSheetData } from './ScoreSheet/types';
import { SCORESHEET_EMPTY } from './ScoreSheet/types';
import { StatusPanel } from './StatusPanel';

type ChessOMaticAppProps = {
  readonly autoloadEngine?: boolean;
};

export function ChessOMatic3000App(props: ChessOMaticAppProps): JSX.Element {
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
  const [pgnMoveList, setPgnMoveList] = createSignal<PgnMoveListData>(PGN_MOVE_LIST_EMPTY);
  const [currentPly, setCurrentPly] = createSignal(0);
  const [scoresheetData, setScoresheetData] = createSignal<ScoreSheetData>(SCORESHEET_EMPTY);
  const [gameMetadata, setGameMetadata] = createSignal<GameMetadataData>(GAME_METADATA_EMPTY);
  const [canGoBackward, setCanGoBackward] = createSignal(false);
  const [canGoForward, setCanGoForward] = createSignal(false);

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
          setCanGoBackward(state.canGoBackward);
          setCanGoForward(state.canGoForward);
          setCurrentPly(state.currentPly);
          setLastInputSanitized(state.lastInputSanitized);
          setLastMoveSan(state.lastMoveSan);
          setLastInputEvaluateStatus(state.lastInputEvaluateStatus);
          setLastInputResultMessage(state.lastInputResultMessage);
          setFen(state.fen);
          setPgn(state.pgn);
          setPgnMoveList(state.pgnMoveList);
          setScoresheetData(state.scoresheetData);
        },
      });

      syncAudioState();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown initialization error';
      setErrorMessage(
        `Unable to initialize Chess-o-matic 3000. Add the local Vosk model to public/models/vosk-model-small-en-us-0.15.zip and retry. (${message})`
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
      <h1>Chess-o-matic 3000</h1>

      <Show when={errorMessage()}>{renderErrorMessage}</Show>

      <StatusPanel
        lastMoveSan={lastMoveSan()}
        message={lastInputResultMessage()}
        sanitizedInput={lastInputSanitized()}
        status={lastInputEvaluateStatus()}
      />

      <div class="flex flex-wrap items-start justify-between gap-3">
        <GameNavigationPanel
          canGoBackward={canGoBackward()}
          canGoForward={canGoForward()}
          disabled={isInitializing() || !!errorMessage()}
          onGoToEnd={() => gameEngine.goToEnd()}
          onGoToStart={() => gameEngine.goToStart()}
          onStepBackward={() => gameEngine.stepBackward()}
          onStepForward={() => gameEngine.stepForward()}
        />

        <ControlsPanel
          disabled={isInitializing() || !!errorMessage()}
          isListening={isListening()}
          isSoundEnabled={isSoundEnabled()}
          onToggleListening={() => void toggleListening()}
          onToggleSound={() => void toggleSound()}
        />
      </div>

      <CollapsibleSection icon={SlidersHorizontal} open title="Info">
        <GameMetadata metadata={gameMetadata()} onMetadataChange={handleMetadataChange} />
      </CollapsibleSection>

      <CollapsibleSection icon={NotebookPen} open title="Scoresheet">
        <ScoreSheet currentPly={currentPly()} onGoToPly={gameEngine.goToPly} scoresheet={scoresheetData()} />
      </CollapsibleSection>

      <CollapsibleSection icon={Grid3x3} open title="Board">
        <ChessBoard
          fen={fen()}
          getPromotionPieceColor={gameEngine.getPromotionPieceColor}
          isLegalMove={gameEngine.isLegalMove}
          onMove={gameEngine.handleBoardMove}
          onReady={(controller) => void setBoardController(controller)}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={FileText} title="PGN">
        <PgnPanel currentPly={currentPly()} onGoToPly={gameEngine.goToPly} pgn={pgn()} pgnMoveList={pgnMoveList()} />
      </CollapsibleSection>

      <CollapsibleSection icon={Binary} title="FEN">
        <FenPanel fen={fen()} />
      </CollapsibleSection>
    </main>
  );
}
