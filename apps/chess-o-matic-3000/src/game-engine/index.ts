import type { Square } from 'chess.js';
import type { RecognizerMessage } from 'vosk-browser/dist/interfaces';

import { createBrowserExternalOpen } from '../application/adapters/browser/BrowserExternalOpen';
import { createBrowserFileExport } from '../application/adapters/browser/BrowserFileExport';
import { createBrowserGameStorage } from '../application/adapters/browser/BrowserGameStorage';
import type { ChessBoardController } from '../application/ports/ChessBoardController';
import type { ExternalOpen } from '../application/ports/ExternalOpen';
import type { FileExport } from '../application/ports/FileExport';
import type { GameStorage } from '../application/ports/GameStorage';
import {
  applyGameMetadata,
  gameRecordToPgn,
  gameRecordToPgnExportDocument,
  gameRecordToScoreSheetExportDocument,
  moveHistoryToPgnMoveList,
  moveHistoryToScoreSheetData,
  resolveGameMoveFlags,
} from '../application/selectors';
import type { ScoreSheetExportFormat } from '../application/types/export';
import { SCORE_SHEET_EXPORT_FORMAT_TEXT } from '../application/types/export';
import type { PgnMoveListData } from '../application/types/pgn';
import { PGN_MOVE_LIST_EMPTY } from '../application/types/pgn';
import type { ScoreSheetData } from '../application/types/scoresheet';
import { SCORESHEET_EMPTY } from '../application/types/scoresheet';
import type { AudioInputResources } from '../audio-input';
import {
  AUDIO_INPUT_LISTENING_OFF,
  AUDIO_INPUT_LISTENING_ON,
  audioInputIsSupported,
  exitAudioInput,
  initAudioInput,
  startAudioInput,
  stopAudioInput,
} from '../audio-input';
import type { AudioOutputResources } from '../audio-output';
import {
  audioOutputIsSupported,
  boardAdapterUpdateMovedSoundsOk,
  exitAudioOutput,
  initAudioOutput,
} from '../audio-output';
import type { GameMetadataData } from '../domain/game/metadata';
import { GAME_METADATA_EMPTY } from '../domain/game/metadata';
import type { AppState, GameBoardOrientation, GameId, PersistedSavedGameIndex } from '../domain/game/types';
import { createDefaultAppState, createEmptyGameRecord, GAME_BOARD_ORIENTATION_WHITE } from '../domain/game/types';
import type { GameModelResources } from '../game-model';
import {
  exitGameModel,
  gameModelCanGoBackward,
  gameModelCanGoForward,
  gameModelCurrentMove,
  gameModelGoToEnd,
  gameModelGoToPly,
  gameModelGoToStart,
  gameModelLoadState,
  gameModelSnapshotState,
  gameModelStepBackward,
  gameModelStepForward,
  initGameModel,
} from '../game-model';
import { START_FEN } from '../game-model/consts';
import type { GameModelEvaluateResult, GameModelEvaluateStatus } from '../game-model/evaluate.js';
import {
  GAME_MODEL_CONTROL_ACTION_FLIP,
  GAME_MODEL_CONTROL_ACTION_UNDO,
  GAME_MODEL_EVALUATE_STATUS_CONTROL,
  GAME_MODEL_EVALUATE_STATUS_IGNORE,
  GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
  GAME_MODEL_EVALUATE_STATUS_OK,
  gameModelEvaluate,
} from '../game-model/evaluate.js';
import type { GameModelEventEvaluated } from '../game-model/events.js';
import {
  GAME_MODEL_EVENT_TYPE_EVALUATED,
  GAME_MODEL_EVENT_TYPE_MOVED_INVALID,
  GAME_MODEL_EVENT_TYPE_MOVED_OK,
  gameModelEventsAddListener,
  gameModelEventsNotifyListeners,
} from '../game-model/events.js';
import {
  GAME_INPUT_PARSE_STATUS_OK_COORDS,
  GAME_INPUT_PARSE_STATUS_OK_SAN,
  gameModelRead,
} from '../game-model/read.js';
import type { SpeechRecognizerResources } from '../speech-recognizer';
import {
  exitSpeechRecognizer,
  initSpeechRecognizer,
  startSpeechRecognizer,
  stopSpeechRecognizer,
} from '../speech-recognizer';
import { chessGrammar } from '../speech-recognizer/grammar/chess-grammar-en.js';
const MODEL_URL = '/models/vosk-model-small-en-us-0.15.zip';

export type GameEngineUiState = {
  readonly canGoBackward: boolean;
  readonly canGoForward: boolean;
  readonly currentPly: number;
  readonly boardOrientation: GameBoardOrientation;
  readonly pgn: string;
  readonly pgnMoveList: PgnMoveListData;
  readonly fen: string;
  readonly gameMetadata: GameMetadataData;
  readonly lastMoveSan: string;
  readonly lastInputSanitized: string;
  readonly lastInputEvaluateStatus: GameModelEvaluateStatus;
  readonly lastInputResultMessage: string;
  readonly scoresheetData: ScoreSheetData;
};

export const GAME_ENGINE_UI_STATE_EMPTY: GameEngineUiState = {
  boardOrientation: GAME_BOARD_ORIENTATION_WHITE,
  canGoBackward: false,
  canGoForward: false,
  currentPly: 0,
  fen: START_FEN,
  gameMetadata: GAME_METADATA_EMPTY,
  lastInputEvaluateStatus: GAME_MODEL_EVALUATE_STATUS_IGNORE,
  lastInputResultMessage: 'No moves',
  lastInputSanitized: '',
  lastMoveSan: '',
  pgn: '',
  pgnMoveList: PGN_MOVE_LIST_EMPTY,
  scoresheetData: SCORESHEET_EMPTY,
} as const;

type GameEngineInitialSettings = {
  readonly audioInputOn?: boolean;
  readonly audioOutputOn?: boolean;
};

export type GameEngineInitOptions = {
  readonly initialSettings?: GameEngineInitialSettings;
  readonly onUiStateChange?: (state: GameEngineUiState) => void;
};

export type GameEngine = {
  readonly init: (options: GameEngineInitOptions) => Promise<void>;
  readonly exit: () => Promise<void>;
  readonly attachBoardController: (controller: ChessBoardController | undefined) => Promise<void>;
  readonly newGame: () => Promise<void>;
  readonly discardGame: () => Promise<void>;
  readonly resetGame: () => Promise<void>;
  readonly saveCurrentGame: () => Promise<void>;
  readonly loadSavedGame: (gameId: GameId) => Promise<void>;
  readonly listSavedGames: () => Promise<PersistedSavedGameIndex>;
  readonly exportGamePgn: (gameId?: GameId) => Promise<void>;
  readonly exportGameScoreSheet: (gameId?: GameId, format?: ScoreSheetExportFormat) => Promise<void>;
  readonly openGameInLichess: (gameId?: GameId) => Promise<void>;
  readonly openGameInChessDotCom: (gameId?: GameId) => Promise<void>;
  readonly setGameMetadata: (metadata: GameMetadataData) => void;
  readonly toggleBoardOrientation: () => void;
  readonly goToStart: () => void;
  readonly goToPly: (ply: number) => void;
  readonly stepBackward: () => void;
  readonly stepForward: () => void;
  readonly goToEnd: () => void;
  readonly isLegalMove: (coords: [Square, Square]) => boolean;
  readonly getPromotionPieceColor: (coords: [Square, Square]) => 'b' | 'w' | undefined;
  readonly handleBoardMove: (move: [Square, Square] | string) => Promise<void>;
  readonly audioInputToggle: () => Promise<void>;
  readonly audioOutputToggle: () => Promise<void>;
  readonly canUseAudioInput: () => boolean;
  readonly canUseAudioOutput: () => boolean;
  readonly isAudioInputOn: () => boolean;
  readonly isAudioOutputOn: () => boolean;
};

type CreateGameEngineDeps = {
  readonly externalOpen?: ExternalOpen;
  readonly fileExport?: FileExport;
  readonly gameStorage?: GameStorage;
};

export function createGameEngine(deps: CreateGameEngineDeps = {}): GameEngine {
  const externalOpen = deps.externalOpen ?? createBrowserExternalOpen();
  const fileExport = deps.fileExport ?? createBrowserFileExport();
  const gameStorage = deps.gameStorage ?? createBrowserGameStorage();
  let appState: AppState | undefined;
  let audioInputResources: AudioInputResources | undefined;
  let audioOutputResources: AudioOutputResources | undefined;
  let gameModelResources: GameModelResources | undefined;
  let speechRecognizerResources: SpeechRecognizerResources | undefined;
  let chessBoardController: ChessBoardController | undefined;
  let onUiStateChange: ((state: GameEngineUiState) => void) | undefined;

  function emitUiState(state: GameEngineUiState): void {
    onUiStateChange?.(state);
  }

  function createInitialAppState(initialSettings: GameEngineInitialSettings = {}): AppState {
    const nextAppState = createDefaultAppState();

    return {
      ...nextAppState,
      settings: {
        audioInputEnabled: initialSettings.audioInputOn ?? nextAppState.settings.audioInputEnabled,
        audioOutputEnabled: initialSettings.audioOutputOn ?? nextAppState.settings.audioOutputEnabled,
      },
    };
  }

  function createGameId(): GameId {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `game-${Date.now()}`;
  }

  function requireAppState(): AppState {
    if (!appState) {
      throw new Error('Game engine state is not initialized.');
    }

    return appState;
  }

  async function resolveGameRecord(gameId?: GameId) {
    const state = requireInitialized();

    if (!gameId || state.appState.currentGame.id === gameId) {
      return state.appState.currentGame;
    }

    const savedGame = await gameStorage.loadGame(gameId);

    if (!savedGame) {
      throw new Error(`Saved game not found: ${gameId}`);
    }

    return savedGame;
  }

  function syncGameModelFromAppState(state: AppState, model: GameModelResources): void {
    gameModelLoadState(model, {
      currentPly: state.currentGame.currentPly,
      moveHistory: state.currentGame.moveHistory,
    });
    applyGameMetadata(model.chess, state.currentGame.metadata, state.currentGame.orientation);
  }

  function syncAppStateFromGameModel(state: AppState, model: GameModelResources): void {
    const snapshot = gameModelSnapshotState(model);

    appState = {
      ...state,
      currentGame: {
        ...state.currentGame,
        currentPly: snapshot.currentPly,
        moveHistory: snapshot.moveHistory,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async function persistAppState(): Promise<void> {
    if (!appState) {
      return;
    }

    await gameStorage.saveAppState(appState);
  }

  function shouldPersistGameToHistory(game: AppState['currentGame']): boolean {
    return game.moveHistory.length > 0;
  }

  function syncAppStateSavedGameIds(gameId: GameId, shouldPersist: boolean): void {
    if (!appState) {
      return;
    }

    appState = {
      ...appState,
      savedGameIds: shouldPersist
        ? [gameId, ...appState.savedGameIds.filter((savedGameId) => savedGameId !== gameId)]
        : appState.savedGameIds.filter((savedGameId) => savedGameId !== gameId),
    };
  }

  async function syncPersistedCurrentGame(game: AppState['currentGame']): Promise<void> {
    if (shouldPersistGameToHistory(game)) {
      await gameStorage.saveGame(game);
      syncAppStateSavedGameIds(game.id, true);
      return;
    }

    if (!appState?.savedGameIds.includes(game.id)) {
      syncAppStateSavedGameIds(game.id, false);
      return;
    }

    await gameStorage.deleteGame(game.id);
    syncAppStateSavedGameIds(game.id, false);
  }

  function emitCurrentUiState(
    state: AppState,
    model: GameModelResources,
    status: GameModelEvaluateStatus,
    message: string,
    sanitizedInput: string,
    lastMoveSan: string
  ): void {
    emitUiState({
      canGoBackward: gameModelCanGoBackward(model),
      canGoForward: gameModelCanGoForward(model),
      currentPly: model.currentPly,
      boardOrientation: state.currentGame.orientation,
      lastInputSanitized: sanitizedInput,
      lastMoveSan,
      lastInputEvaluateStatus: status,
      lastInputResultMessage: message,
      fen: model.chess.fen(),
      gameMetadata: state.currentGame.metadata,
      pgn: model.chess.pgn(),
      pgnMoveList: moveHistoryToPgnMoveList(model.moveHistory),
      scoresheetData: moveHistoryToScoreSheetData(model.moveHistory),
    });
  }

  function syncBoardPosition(): void {
    if (!gameModelResources || !chessBoardController) {
      return;
    }

    const currentMove = gameModelCurrentMove(gameModelResources);
    const lastMove = currentMove ? ([currentMove.from, currentMove.to] as [Square, Square]) : undefined;
    chessBoardController.renderPosition(gameModelResources.chess.fen(), lastMove);
  }

  function getResultMessage(result: GameModelEvaluateResult, model: GameModelResources): string {
    switch (result.status) {
      case GAME_MODEL_EVALUATE_STATUS_OK:
        return model.chess.history().at(-1) ?? 'Move accepted';
      case GAME_MODEL_EVALUATE_STATUS_ILLEGAL:
        return result.message;
      case GAME_MODEL_EVALUATE_STATUS_CONTROL:
        if (result.action === GAME_MODEL_CONTROL_ACTION_FLIP) {
          return 'Board flipped';
        }

        if (result.action === GAME_MODEL_CONTROL_ACTION_UNDO) {
          return 'Moved back one ply';
        }

        return 'Control action applied';
      case GAME_MODEL_EVALUATE_STATUS_IGNORE:
      default:
        return result.sanitized === '' ? 'No input' : 'Input ignored';
    }
  }

  function currentComSettings(state: AppState): { readonly audioInputOn: boolean; readonly audioOutputOn: boolean } {
    return {
      audioInputOn: state.settings.audioInputEnabled,
      audioOutputOn: state.settings.audioOutputEnabled,
    };
  }

  function createInitialStatusSnapshot(state: AppState): {
    readonly lastMoveSan: string;
    readonly message: string;
    readonly sanitizedInput: string;
    readonly status: GameModelEvaluateStatus;
  } {
    const currentMoveSan =
      state.currentGame.currentPly > 0 ? state.currentGame.moveHistory[state.currentGame.currentPly - 1]?.san ?? '' : '';
    const isAtLatestMove =
      state.currentGame.currentPly > 0 && state.currentGame.currentPly === state.currentGame.moveHistory.length;

    if (isAtLatestMove && currentMoveSan !== '') {
      return {
        lastMoveSan: currentMoveSan,
        message: currentMoveSan,
        sanitizedInput: '',
        status: GAME_MODEL_EVALUATE_STATUS_OK,
      };
    }

    if (currentMoveSan !== '') {
      return {
        lastMoveSan: currentMoveSan,
        message: 'Viewing past move',
        sanitizedInput: '',
        status: GAME_MODEL_EVALUATE_STATUS_IGNORE,
      };
    }

    return {
      lastMoveSan: '',
      message: 'No moves',
      sanitizedInput: '',
      status: GAME_MODEL_EVALUATE_STATUS_IGNORE,
    };
  }

  function createNavigationStatusSnapshot(model: GameModelResources): {
    readonly lastMoveSan: string;
    readonly message: string;
    readonly status: GameModelEvaluateStatus;
  } {
    const lastMoveSan = model.chess.history().at(-1) ?? '';
    const isAtLatestMove = model.currentPly > 0 && model.currentPly === model.moveHistory.length;

    if (isAtLatestMove) {
      return {
        lastMoveSan,
        message: 'OK',
        status: GAME_MODEL_EVALUATE_STATUS_OK,
      };
    }

    return {
      lastMoveSan,
      message: 'VIEWING PAST MOVE',
      status: GAME_MODEL_EVALUATE_STATUS_IGNORE,
    };
  }

  function requireInitialized(): {
    appState: AppState;
    audioInputResources: AudioInputResources;
    audioOutputResources: AudioOutputResources;
    gameModelResources: GameModelResources;
  } {
    if (!appState || !audioInputResources || !audioOutputResources || !gameModelResources) {
      throw new Error('Game engine is not initialized.');
    }

    return {
      appState,
      audioInputResources,
      audioOutputResources,
      gameModelResources,
    };
  }

  function requireBoardController(): ChessBoardController {
    if (!chessBoardController) {
      throw new Error('Chess board controller is not attached.');
    }

    return chessBoardController;
  }

  async function handleEvaluatedResult(result: GameModelEvaluateResult): Promise<void> {
    const state = requireInitialized();
    const model = state.gameModelResources;
    emitCurrentUiState(
      state.appState,
      model,
      result.status,
      getResultMessage(result, model),
      result.sanitized,
      model.chess.history().at(-1) ?? ''
    );
  }

  async function handleMoveResult(result: GameModelEvaluateResult): Promise<void> {
    const state = requireInitialized();

    if (result.status === GAME_MODEL_EVALUATE_STATUS_OK) {
      syncAppStateFromGameModel(state.appState, state.gameModelResources);
      const nextState = requireAppState();
      await syncPersistedCurrentGame(nextState.currentGame);
      await persistAppState();
      const flags = resolveGameMoveFlags(state.gameModelResources.chess, nextState.currentGame.orientation);
      syncBoardPosition();
      await boardAdapterUpdateMovedSoundsOk(currentComSettings(nextState), state.audioOutputResources, flags);
      await gameModelEventsNotifyListeners(state.gameModelResources, GAME_MODEL_EVENT_TYPE_MOVED_OK, {
        type: GAME_MODEL_EVENT_TYPE_MOVED_OK,
        result,
      });
    }

    if (result.status === GAME_MODEL_EVALUATE_STATUS_ILLEGAL || result.status === GAME_MODEL_EVALUATE_STATUS_IGNORE) {
      await gameModelEventsNotifyListeners(state.gameModelResources, GAME_MODEL_EVENT_TYPE_MOVED_INVALID, {
        type: GAME_MODEL_EVENT_TYPE_MOVED_INVALID,
        result,
      });
    }

    if (result.status === GAME_MODEL_EVALUATE_STATUS_CONTROL) {
      if (result.action === GAME_MODEL_CONTROL_ACTION_FLIP) {
        toggleBoardOrientation();
      }

      if (result.action === GAME_MODEL_CONTROL_ACTION_UNDO) {
        gameModelStepBackward(state.gameModelResources);
        syncAppStateFromGameModel(state.appState, state.gameModelResources);
        applyGameMetadata(
          state.gameModelResources.chess,
          requireAppState().currentGame.metadata,
          requireAppState().currentGame.orientation
        );
        await persistAppState();
        syncBoardPosition();
      }
    }

    await gameModelEventsNotifyListeners(state.gameModelResources, GAME_MODEL_EVENT_TYPE_EVALUATED, {
      type: GAME_MODEL_EVENT_TYPE_EVALUATED,
      result,
    });
  }

  async function evaluateBoardMove(move: [Square, Square] | string): Promise<void> {
    const state = requireInitialized();

    const evaluateResult = gameModelEvaluate(
      state.gameModelResources,
      typeof move === 'string'
        ? {
            status: GAME_INPUT_PARSE_STATUS_OK_SAN,
            input: move,
            sanitized: move,
            parsed: move,
            san: { candidates: [move] },
          }
        : {
            status: GAME_INPUT_PARSE_STATUS_OK_COORDS,
            input: JSON.stringify(move),
            sanitized: `${move[0]} to ${move[1]}`,
            parsed: JSON.stringify(move),
            coords: move,
          }
    );

    await handleMoveResult(evaluateResult);
  }

  async function gameEngineTick(result: string): Promise<void> {
    const state = requireInitialized();
    const readResult = gameModelRead(result);
    const evaluateResult = gameModelEvaluate(state.gameModelResources, readResult);
    await handleMoveResult(evaluateResult);
  }

  async function recognizerCallbackResult(message: RecognizerMessage): Promise<void> {
    if ('result' in message && 'text' in message.result && message.result.text !== '') {
      await gameEngineTick(message.result.text);
    }
  }

  async function recognizerCallbackError(message: RecognizerMessage): Promise<void> {
    console.error('Err:', message);
  }

  async function ensureSpeechRecognizerResources(): Promise<SpeechRecognizerResources> {
    if (speechRecognizerResources) {
      return speechRecognizerResources;
    }

    speechRecognizerResources = await initSpeechRecognizer(MODEL_URL);
    return speechRecognizerResources;
  }

  async function audioInputOn(): Promise<void> {
    const state = requireInitialized();
    requireBoardController();

    if (!canUseAudioInput()) {
      throw new Error('Speech input is not supported in this browser.');
    }

    if (state.audioInputResources.status === AUDIO_INPUT_LISTENING_ON) {
      appState = {
        ...state.appState,
        settings: {
          ...state.appState.settings,
          audioInputEnabled: true,
        },
      };
      await persistAppState();
      return;
    }

    const baseSpeechRecognizerResources = await ensureSpeechRecognizerResources();

    try {
      audioInputResources = await startAudioInput();

      const nextSpeechRecognizerResources = await startSpeechRecognizer(
        baseSpeechRecognizerResources,
        audioInputResources.audioContext.sampleRate,
        chessGrammar
      );

      audioInputResources.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio' && audioInputResources?.status === AUDIO_INPUT_LISTENING_ON) {
          nextSpeechRecognizerResources.recognizer.acceptWaveformFloat(
            event.data.data,
            audioInputResources.audioContext.sampleRate
          );
        }
      };

      nextSpeechRecognizerResources.recognizer.on('result', recognizerCallbackResult);
      nextSpeechRecognizerResources.recognizer.on('error', recognizerCallbackError);

      speechRecognizerResources = nextSpeechRecognizerResources;
      appState = {
        ...state.appState,
        settings: {
          ...state.appState.settings,
          audioInputEnabled: true,
        },
      };
      await persistAppState();
    } catch (error) {
      if (audioInputResources?.status === AUDIO_INPUT_LISTENING_ON) {
        audioInputResources = await stopAudioInput(audioInputResources);
      }

      appState = {
        ...state.appState,
        settings: {
          ...state.appState.settings,
          audioInputEnabled: false,
        },
      };
      await persistAppState();
      throw error;
    }
  }

  async function audioInputOff(): Promise<void> {
    const state = requireInitialized();

    if (state.audioInputResources.status === AUDIO_INPUT_LISTENING_OFF) {
      return;
    }

    state.audioInputResources.workletNode.port.onmessage = null;
    if (speechRecognizerResources) {
      speechRecognizerResources = await stopSpeechRecognizer(speechRecognizerResources);
    }
    audioInputResources = await stopAudioInput(state.audioInputResources);
    appState = {
      ...state.appState,
      settings: {
        ...state.appState.settings,
        audioInputEnabled: false,
      },
    };
    await persistAppState();
  }

  async function exit(): Promise<void> {
    if (!appState || !audioInputResources || !audioOutputResources || !gameModelResources) {
      return;
    }

    if (isAudioInputOn()) {
      await audioInputOff();
    }

    await exitGameModel(gameModelResources);
    await exitAudioInput(audioInputResources);
    if (speechRecognizerResources) {
      await exitSpeechRecognizer(speechRecognizerResources);
    }
    await exitAudioOutput(audioOutputResources);

    appState = undefined;
    audioInputResources = undefined;
    audioOutputResources = undefined;
    gameModelResources = undefined;
    speechRecognizerResources = undefined;
    chessBoardController = undefined;
    onUiStateChange = undefined;
  }

  async function attachBoardController(controller: ChessBoardController | undefined): Promise<void> {
    const shouldRestartAudio = isAudioInputOn();
    if (shouldRestartAudio) {
      await audioInputOff();
    }

    chessBoardController = controller;
    syncBoardPosition();

    if (controller && appState?.settings.audioInputEnabled) {
      try {
        await audioInputOn();
      } catch (error) {
        console.warn('[chess-o-matic-3000][game-engine] Unable to restart speech input after board attach.', error);
        appState = {
          ...requireAppState(),
          settings: {
            ...requireAppState().settings,
            audioInputEnabled: false,
          },
        };
        await persistAppState();
      }
    }
  }

  function isAudioInputOn(): boolean {
    return audioInputResources?.status === AUDIO_INPUT_LISTENING_ON;
  }

  async function audioInputToggle(): Promise<void> {
    if (isAudioInputOn()) {
      await audioInputOff();
      return;
    }

    await audioInputOn();
  }

  async function audioOutputToggle(): Promise<void> {
    if (!canUseAudioOutput()) {
      throw new Error('Audio output is not supported in this browser.');
    }

    const state = requireInitialized();
    appState = {
      ...state.appState,
      settings: {
        ...state.appState.settings,
        audioOutputEnabled: !state.appState.settings.audioOutputEnabled,
      },
    };
    await persistAppState();
  }

  function canUseAudioInput(): boolean {
    return audioInputIsSupported();
  }

  function canUseAudioOutput(): boolean {
    return audioOutputIsSupported();
  }

  function isAudioOutputOn(): boolean {
    return appState?.settings.audioOutputEnabled ?? false;
  }

  function isLegalMove(coords: [Square, Square]): boolean {
    const model = requireInitialized().gameModelResources;
    return model.isLegalMove(coords);
  }

  function getPromotionPieceColor(coords: [Square, Square]): 'b' | 'w' | undefined {
    const model = requireInitialized().gameModelResources;
    const piece = model.chess.get(coords[0]);
    const isPawn = piece?.type === 'p';
    const isPromotionRank = coords[1].endsWith('8') || coords[1].endsWith('1');

    if (!isPawn || !isPromotionRank || !piece) {
      return undefined;
    }

    return piece.color;
  }

  async function handleBoardMove(move: [Square, Square] | string): Promise<void> {
    await evaluateBoardMove(move);
  }

  async function newGame(): Promise<void> {
    const state = requireInitialized();
    await syncPersistedCurrentGame(state.appState.currentGame);
    const nextAppState: AppState = {
      ...state.appState,
      currentGame: createEmptyGameRecord(new Date().toISOString(), createGameId()),
    };

    appState = nextAppState;
    syncGameModelFromAppState(nextAppState, state.gameModelResources);
    syncBoardPosition();
    await syncPersistedCurrentGame(nextAppState.currentGame);
    await persistAppState();
    emitCurrentUiState(nextAppState, state.gameModelResources, GAME_MODEL_EVALUATE_STATUS_IGNORE, 'New game', '', '');
  }

  async function discardGame(): Promise<void> {
    const state = requireInitialized();
    const discardedGameId = state.appState.currentGame.id;
    const nextAppState: AppState = {
      ...state.appState,
      currentGame: createEmptyGameRecord(new Date().toISOString(), createGameId()),
      savedGameIds: state.appState.savedGameIds.filter((savedGameId) => savedGameId !== discardedGameId),
    };

    await gameStorage.deleteGame(discardedGameId);
    appState = nextAppState;
    syncGameModelFromAppState(nextAppState, state.gameModelResources);
    syncBoardPosition();
    await syncPersistedCurrentGame(nextAppState.currentGame);
    await persistAppState();
    emitCurrentUiState(
      nextAppState,
      state.gameModelResources,
      GAME_MODEL_EVALUATE_STATUS_IGNORE,
      'Game discarded',
      '',
      ''
    );
  }

  async function resetGame(): Promise<void> {
    const state = requireInitialized();
    await gameStorage.deleteGame(state.appState.currentGame.id);
    const nextAppState: AppState = {
      ...state.appState,
      currentGame: createEmptyGameRecord(new Date().toISOString(), state.appState.currentGame.id),
    };

    appState = nextAppState;
    syncGameModelFromAppState(nextAppState, state.gameModelResources);
    syncBoardPosition();
    await syncPersistedCurrentGame(nextAppState.currentGame);
    await persistAppState();
    emitCurrentUiState(nextAppState, state.gameModelResources, GAME_MODEL_EVALUATE_STATUS_IGNORE, 'Game reset', '', '');
  }

  async function saveCurrentGame(): Promise<void> {
    const state = requireInitialized();
    await syncPersistedCurrentGame(state.appState.currentGame);

    await persistAppState();
  }

  async function loadSavedGame(gameId: GameId): Promise<void> {
    const state = requireInitialized();
    const savedGame = await gameStorage.loadGame(gameId);

    if (!savedGame) {
      throw new Error(`Saved game not found: ${gameId}`);
    }

    const nextAppState: AppState = {
      ...state.appState,
      currentGame: {
        ...savedGame,
        currentPly: savedGame.moveHistory.length,
      },
      savedGameIds: [gameId, ...state.appState.savedGameIds.filter((savedGameId) => savedGameId !== gameId)],
    };

    appState = nextAppState;
    syncGameModelFromAppState(nextAppState, state.gameModelResources);
    syncBoardPosition();
    await syncPersistedCurrentGame(nextAppState.currentGame);
    await persistAppState();
    emitCurrentUiState(nextAppState, state.gameModelResources, GAME_MODEL_EVALUATE_STATUS_OK, 'OK', '', savedGame.moveHistory.at(-1)?.san ?? '');
  }

  async function listSavedGames(): Promise<PersistedSavedGameIndex> {
    return gameStorage.loadSavedGameIndex();
  }

  async function exportGamePgn(gameId?: GameId): Promise<void> {
    const game = await resolveGameRecord(gameId);
    await fileExport.exportPgn(gameRecordToPgnExportDocument(game));
  }

  async function exportGameScoreSheet(
    gameId?: GameId,
    format: ScoreSheetExportFormat = SCORE_SHEET_EXPORT_FORMAT_TEXT
  ): Promise<void> {
    const game = await resolveGameRecord(gameId);
    await fileExport.exportScoreSheet(gameRecordToScoreSheetExportDocument(game, format));
  }

  async function openGameInLichess(gameId?: GameId): Promise<void> {
    const game = await resolveGameRecord(gameId);
    await externalOpen.openLichess({
      pgn: gameRecordToPgn(game),
    });
  }

  async function openGameInChessDotCom(gameId?: GameId): Promise<void> {
    const game = await resolveGameRecord(gameId);
    await externalOpen.openChessDotCom({
      pgn: gameRecordToPgn(game),
    });
  }

  function setGameMetadata(metadata: GameMetadataData): void {
    if (!gameModelResources || !appState) {
      return;
    }

    appState = {
      ...appState,
      currentGame: {
        ...appState.currentGame,
        metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    applyGameMetadata(gameModelResources.chess, appState.currentGame.metadata, appState.currentGame.orientation);
    void syncPersistedCurrentGame(appState.currentGame);
    void persistAppState();
    emitCurrentUiState(
      appState,
      gameModelResources,
      GAME_MODEL_EVALUATE_STATUS_IGNORE,
      'Game metadata updated',
      '',
      gameModelResources.chess.history().at(-1) ?? ''
    );
  }

  function toggleBoardOrientation(): void {
    if (!gameModelResources || !appState) {
      return;
    }

    appState = {
      ...appState,
      currentGame: {
        ...appState.currentGame,
        orientation: appState.currentGame.orientation === 'white' ? 'black' : 'white',
        updatedAt: new Date().toISOString(),
      },
    };

    void syncPersistedCurrentGame(appState.currentGame);
    void persistAppState();
    emitCurrentUiState(
      appState,
      gameModelResources,
      GAME_MODEL_EVALUATE_STATUS_IGNORE,
      'Board orientation updated',
      '',
      gameModelResources.chess.history().at(-1) ?? ''
    );
  }

  function navigateToStart(): void {
    const state = requireInitialized();
    const model = state.gameModelResources;
    gameModelGoToStart(model);
    syncAppStateFromGameModel(state.appState, model);
    applyGameMetadata(model.chess, requireAppState().currentGame.metadata, requireAppState().currentGame.orientation);
    syncBoardPosition();
    void syncPersistedCurrentGame(requireAppState().currentGame);
    void persistAppState();
    const snapshot = createNavigationStatusSnapshot(model);
    emitCurrentUiState(requireAppState(), model, snapshot.status, snapshot.message, '', snapshot.lastMoveSan);
  }

  function navigateStepBackward(): void {
    const state = requireInitialized();
    const model = state.gameModelResources;
    gameModelStepBackward(model);
    syncAppStateFromGameModel(state.appState, model);
    applyGameMetadata(model.chess, requireAppState().currentGame.metadata, requireAppState().currentGame.orientation);
    syncBoardPosition();
    void syncPersistedCurrentGame(requireAppState().currentGame);
    void persistAppState();
    const snapshot = createNavigationStatusSnapshot(model);
    emitCurrentUiState(requireAppState(), model, snapshot.status, snapshot.message, '', snapshot.lastMoveSan);
  }

  function navigateStepForward(): void {
    const state = requireInitialized();
    const model = state.gameModelResources;
    gameModelStepForward(model);
    syncAppStateFromGameModel(state.appState, model);
    applyGameMetadata(model.chess, requireAppState().currentGame.metadata, requireAppState().currentGame.orientation);
    syncBoardPosition();
    void syncPersistedCurrentGame(requireAppState().currentGame);
    void persistAppState();
    const snapshot = createNavigationStatusSnapshot(model);
    emitCurrentUiState(requireAppState(), model, snapshot.status, snapshot.message, '', snapshot.lastMoveSan);
  }

  function navigateToEnd(): void {
    const state = requireInitialized();
    const model = state.gameModelResources;
    gameModelGoToEnd(model);
    syncAppStateFromGameModel(state.appState, model);
    applyGameMetadata(model.chess, requireAppState().currentGame.metadata, requireAppState().currentGame.orientation);
    syncBoardPosition();
    void syncPersistedCurrentGame(requireAppState().currentGame);
    void persistAppState();
    const snapshot = createNavigationStatusSnapshot(model);
    emitCurrentUiState(requireAppState(), model, snapshot.status, snapshot.message, '', snapshot.lastMoveSan);
  }

  function navigateToPly(ply: number): void {
    const state = requireInitialized();
    const model = state.gameModelResources;
    gameModelGoToPly(model, ply);
    syncAppStateFromGameModel(state.appState, model);
    applyGameMetadata(model.chess, requireAppState().currentGame.metadata, requireAppState().currentGame.orientation);
    syncBoardPosition();
    void syncPersistedCurrentGame(requireAppState().currentGame);
    void persistAppState();
    const snapshot = createNavigationStatusSnapshot(model);
    emitCurrentUiState(requireAppState(), model, snapshot.status, snapshot.message, '', snapshot.lastMoveSan);
  }

  async function init({ initialSettings, onUiStateChange: onStateChange }: GameEngineInitOptions): Promise<void> {
    if (appState) {
      await exit();
    }

    onUiStateChange = onStateChange;

    appState = (await gameStorage.loadAppState()) ?? createInitialAppState(initialSettings);
    audioInputResources = await initAudioInput();
    audioOutputResources = await initAudioOutput();
    gameModelResources = await initGameModel();
    syncGameModelFromAppState(appState, gameModelResources);
    await syncPersistedCurrentGame(appState.currentGame);

    gameModelEventsAddListener(
      gameModelResources,
      GAME_MODEL_EVENT_TYPE_EVALUATED,
      async (event: GameModelEventEvaluated): Promise<void> => {
        await handleEvaluatedResult(event.result);
      }
    );

    const initialStatusSnapshot = createInitialStatusSnapshot(appState);
    emitCurrentUiState(
      appState,
      gameModelResources,
      initialStatusSnapshot.status,
      initialStatusSnapshot.message,
      initialStatusSnapshot.sanitizedInput,
      initialStatusSnapshot.lastMoveSan
    );
    syncBoardPosition();
    await persistAppState();

    if (appState.settings.audioInputEnabled && chessBoardController) {
      await audioInputOn();
    }
  }

  return {
    init,
    exit,
    attachBoardController,
    newGame,
    discardGame,
    resetGame,
    saveCurrentGame,
    loadSavedGame,
    listSavedGames,
    exportGamePgn,
    exportGameScoreSheet,
    openGameInLichess,
    openGameInChessDotCom,
    setGameMetadata,
    toggleBoardOrientation,
    goToStart: navigateToStart,
    goToPly: navigateToPly,
    stepBackward: navigateStepBackward,
    stepForward: navigateStepForward,
    goToEnd: navigateToEnd,
    isLegalMove,
    getPromotionPieceColor,
    handleBoardMove,
    audioInputToggle,
    audioOutputToggle,
    canUseAudioInput,
    canUseAudioOutput,
    isAudioInputOn,
    isAudioOutputOn,
  };
}
