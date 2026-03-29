import type { Square } from 'chess.js';
import type { RecognizerMessage } from 'vosk-browser/dist/interfaces';

import type { AudioInputResources } from '../audio-input';
import {
  AUDIO_INPUT_LISTENING_OFF,
  AUDIO_INPUT_LISTENING_ON,
  exitAudioInput,
  initAudioInput,
  startAudioInput,
  stopAudioInput,
} from '../audio-input';
import type { AudioOutputResources } from '../audio-output';
import { boardAdapterUpdateMovedSoundsOk, exitAudioOutput, initAudioOutput } from '../audio-output';
import type { ChessBoardController } from '../features/chess/components/ChessBoard/controller';
import type { GameMetadataData } from '../features/chess/components/GameMetadata/types';
import { GAME_METADATA_EMPTY } from '../features/chess/components/GameMetadata/types';
import { moveHistoryToPgnMoveList } from '../features/chess/components/PgnPanel/move-history-to-pgn-move-list';
import type { PgnMoveListData } from '../features/chess/components/PgnPanel/types';
import { pgnToScoreSheetData } from '../features/chess/components/ScoreSheet/pgn-to-scoresheet-data';
import type { ScoreSheetData } from '../features/chess/components/ScoreSheet/types';
import type { GameModelResources } from '../game-model';
import {
  exitGameModel,
  gameModelCanGoBackward,
  gameModelCanGoForward,
  gameModelCurrentMove,
  gameModelGoToEnd,
  gameModelGoToPly,
  gameModelGoToStart,
  gameModelStepBackward,
  gameModelStepForward,
  initGameModel,
} from '../game-model';
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
import type { ComSettings } from '../settings';
import { initComSettings } from '../settings';
import type { SpeechRecognizerResources } from '../speech-recognizer';
import {
  exitSpeechRecognizer,
  initSpeechRecognizer,
  startSpeechRecognizer,
  stopSpeechRecognizer,
} from '../speech-recognizer';
import { chessGrammar } from '../speech-recognizer/grammar/chess-grammar-en.js';
import { applyGameMetadata } from './game-metadata';

const MODEL_URL = '/models/vosk-model-small-en-us-0.15.zip';

export type GameEngineUiState = {
  readonly canGoBackward: boolean;
  readonly canGoForward: boolean;
  readonly currentPly: number;
  readonly pgn: string;
  readonly pgnMoveList: PgnMoveListData;
  readonly fen: string;
  readonly lastMoveSan: string;
  readonly lastInputSanitized: string;
  readonly lastInputEvaluateStatus: GameModelEvaluateStatus;
  readonly lastInputResultMessage: string;
  readonly scoresheetData: ScoreSheetData;
};

export type GameEngineInitOptions = {
  readonly initialSettings?: Partial<ComSettings>;
  readonly onUiStateChange?: (state: GameEngineUiState) => void;
};

export type GameEngine = {
  readonly init: (options: GameEngineInitOptions) => Promise<void>;
  readonly exit: () => Promise<void>;
  readonly attachBoardController: (controller: ChessBoardController | undefined) => Promise<void>;
  readonly setGameMetadata: (metadata: GameMetadataData) => void;
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
  readonly isAudioInputOn: () => boolean;
  readonly isAudioOutputOn: () => boolean;
};

export function createGameEngine(): GameEngine {
  let settings: ComSettings | undefined;
  let audioInputResources: AudioInputResources | undefined;
  let audioOutputResources: AudioOutputResources | undefined;
  let gameModelResources: GameModelResources | undefined;
  let speechRecognizerResources: SpeechRecognizerResources | undefined;
  let chessBoardController: ChessBoardController | undefined;
  let onUiStateChange: ((state: GameEngineUiState) => void) | undefined;
  let gameMetadata: GameMetadataData = GAME_METADATA_EMPTY;

  function emitUiState(state: GameEngineUiState): void {
    onUiStateChange?.(state);
  }

  function emitCurrentUiState(
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
      lastInputSanitized: sanitizedInput,
      lastMoveSan,
      lastInputEvaluateStatus: status,
      lastInputResultMessage: message,
      fen: model.chess.fen(),
      pgn: model.chess.pgn(),
      pgnMoveList: moveHistoryToPgnMoveList(model.moveHistory),
      scoresheetData: pgnToScoreSheetData(model.chess.pgn()),
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

  function requireInitialized(): {
    settings: ComSettings;
    audioInputResources: AudioInputResources;
    audioOutputResources: AudioOutputResources;
    gameModelResources: GameModelResources;
    speechRecognizerResources: SpeechRecognizerResources;
  } {
    if (
      !settings ||
      !audioInputResources ||
      !audioOutputResources ||
      !gameModelResources ||
      !speechRecognizerResources
    ) {
      throw new Error('Game engine is not initialized.');
    }

    return {
      settings,
      audioInputResources,
      audioOutputResources,
      gameModelResources,
      speechRecognizerResources,
    };
  }

  function requireBoardController(): ChessBoardController {
    if (!chessBoardController) {
      throw new Error('Chess board controller is not attached.');
    }

    return chessBoardController;
  }

  async function handleEvaluatedResult(result: GameModelEvaluateResult): Promise<void> {
    const model = requireInitialized().gameModelResources;
    emitCurrentUiState(
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
      syncBoardPosition();
      await boardAdapterUpdateMovedSoundsOk(state.settings, state.audioOutputResources, result);
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
        requireBoardController().toggleOrientation();
      }

      if (result.action === GAME_MODEL_CONTROL_ACTION_UNDO) {
        gameModelStepBackward(state.gameModelResources);
        applyGameMetadata(state.gameModelResources.chess, gameMetadata);
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
    const boardController = requireBoardController();

    const evaluateResult = gameModelEvaluate(
      state.gameModelResources,
      boardController,
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
    const boardController = requireBoardController();
    const readResult = gameModelRead(result);
    const evaluateResult = gameModelEvaluate(state.gameModelResources, boardController, readResult);
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

  async function audioInputOn(): Promise<void> {
    const state = requireInitialized();
    requireBoardController();

    if (state.audioInputResources.status === AUDIO_INPUT_LISTENING_ON) {
      state.settings.audioInputOn = true;
      return;
    }

    audioInputResources = await startAudioInput();

    const nextSpeechRecognizerResources = await startSpeechRecognizer(
      state.speechRecognizerResources,
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
    state.settings.audioInputOn = true;
  }

  async function audioInputOff(): Promise<void> {
    const state = requireInitialized();

    if (state.audioInputResources.status === AUDIO_INPUT_LISTENING_OFF) {
      return;
    }

    state.audioInputResources.workletNode.port.onmessage = null;
    speechRecognizerResources = await stopSpeechRecognizer(state.speechRecognizerResources);
    audioInputResources = await stopAudioInput(state.audioInputResources);
    state.settings.audioInputOn = false;
  }

  async function exit(): Promise<void> {
    if (
      !settings ||
      !audioInputResources ||
      !audioOutputResources ||
      !gameModelResources ||
      !speechRecognizerResources
    ) {
      return;
    }

    if (isAudioInputOn()) {
      await audioInputOff();
    }

    await exitGameModel(gameModelResources);
    await exitAudioInput(audioInputResources);
    await exitSpeechRecognizer(speechRecognizerResources);
    await exitAudioOutput(audioOutputResources);

    settings = undefined;
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

    if (controller && settings?.audioInputOn) {
      await audioInputOn();
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
    requireInitialized().settings.audioOutputOn = !requireInitialized().settings.audioOutputOn;
  }

  function isAudioOutputOn(): boolean {
    return settings?.audioOutputOn ?? false;
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

  function setGameMetadata(metadata: GameMetadataData): void {
    gameMetadata = metadata;

    if (!gameModelResources) {
      return;
    }

    applyGameMetadata(gameModelResources.chess, gameMetadata);
    emitCurrentUiState(
      gameModelResources,
      GAME_MODEL_EVALUATE_STATUS_IGNORE,
      'Game metadata updated',
      '',
      gameModelResources.chess.history().at(-1) ?? ''
    );
  }

  function navigateToStart(): void {
    const model = requireInitialized().gameModelResources;
    gameModelGoToStart(model);
    applyGameMetadata(model.chess, gameMetadata);
    syncBoardPosition();
    emitCurrentUiState(model, GAME_MODEL_EVALUATE_STATUS_IGNORE, 'At game start', '', '');
  }

  function navigateStepBackward(): void {
    const model = requireInitialized().gameModelResources;
    gameModelStepBackward(model);
    applyGameMetadata(model.chess, gameMetadata);
    syncBoardPosition();
    emitCurrentUiState(
      model,
      GAME_MODEL_EVALUATE_STATUS_IGNORE,
      'Moved back one ply',
      '',
      model.chess.history().at(-1) ?? ''
    );
  }

  function navigateStepForward(): void {
    const model = requireInitialized().gameModelResources;
    gameModelStepForward(model);
    applyGameMetadata(model.chess, gameMetadata);
    syncBoardPosition();
    emitCurrentUiState(
      model,
      GAME_MODEL_EVALUATE_STATUS_IGNORE,
      'Moved forward one ply',
      '',
      model.chess.history().at(-1) ?? ''
    );
  }

  function navigateToEnd(): void {
    const model = requireInitialized().gameModelResources;
    gameModelGoToEnd(model);
    applyGameMetadata(model.chess, gameMetadata);
    syncBoardPosition();
    emitCurrentUiState(model, GAME_MODEL_EVALUATE_STATUS_IGNORE, 'At game end', '', model.chess.history().at(-1) ?? '');
  }

  function navigateToPly(ply: number): void {
    const model = requireInitialized().gameModelResources;
    gameModelGoToPly(model, ply);
    applyGameMetadata(model.chess, gameMetadata);
    syncBoardPosition();
    emitCurrentUiState(model, GAME_MODEL_EVALUATE_STATUS_IGNORE, 'Moved to selected ply', '', model.chess.history().at(-1) ?? '');
  }

  async function init({ initialSettings, onUiStateChange: onStateChange }: GameEngineInitOptions): Promise<void> {
    if (settings) {
      await exit();
    }

    onUiStateChange = onStateChange;

    settings = await initComSettings(initialSettings);
    audioInputResources = await initAudioInput();
    audioOutputResources = await initAudioOutput();
    gameModelResources = await initGameModel();
    speechRecognizerResources = await initSpeechRecognizer(MODEL_URL);
    applyGameMetadata(gameModelResources.chess, gameMetadata);

    gameModelEventsAddListener(
      gameModelResources,
      GAME_MODEL_EVENT_TYPE_EVALUATED,
      async (event: GameModelEventEvaluated): Promise<void> => {
        await handleEvaluatedResult(event.result);
      }
    );

    emitCurrentUiState(gameModelResources, GAME_MODEL_EVALUATE_STATUS_IGNORE, 'No moves', '', '');
    syncBoardPosition();

    if (settings.audioInputOn && chessBoardController) {
      await audioInputOn();
    }
  }

  return {
    init,
    exit,
    attachBoardController,
    setGameMetadata,
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
    isAudioInputOn,
    isAudioOutputOn,
  };
}
