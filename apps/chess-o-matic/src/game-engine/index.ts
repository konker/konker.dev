import { parsePgn } from 'chessops/pgn';
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
import type { BoardAdapterMountElements, BoardAdapterResources } from '../board-adapter';
import {
  boardAdapterUpdateControl,
  boardAdapterUpdateMovedInvalid,
  boardAdapterUpdateMovedOk,
  exitBoardAdapter,
  initBoardAdapter,
} from '../board-adapter';
import type { GameModelResources } from '../game-model';
import { exitGameModel, initGameModel } from '../game-model';
import type { GameModelEvaluateResult, GameModelEvaluateStatus } from '../game-model/evaluate.js';
import {
  GAME_MODEL_CONTROL_ACTION_FLIP,
  GAME_MODEL_EVALUATE_STATUS_CONTROL,
  GAME_MODEL_EVALUATE_STATUS_IGNORE,
  GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
  GAME_MODEL_EVALUATE_STATUS_OK,
  gameModelEvaluate,
} from '../game-model/evaluate.js';
import type {
  GameModelEventControl,
  GameModelEventEvaluated,
  GameModelEventMovedInvalid,
  GameModelEventMovedOk,
  GameModelEventViewChanged,
} from '../game-model/events.js';
import {
  GAME_MODEL_EVENT_TYPE_CONTROL,
  GAME_MODEL_EVENT_TYPE_EVALUATED,
  GAME_MODEL_EVENT_TYPE_MOVED_INVALID,
  GAME_MODEL_EVENT_TYPE_MOVED_OK,
  GAME_MODEL_EVENT_TYPE_VIEW_CHANGED,
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
import type { SpeechRecognizerResources } from '../speech-recognizer-model';
import {
  exitSpeechRecognizer,
  initSpeechRecognizer,
  startSpeechRecognizer,
  stopSpeechRecognizer,
} from '../speech-recognizer-model';
import { chessGrammar } from '../speech-recognizer-model/grammar/chess-grammar-en.js';

const MODEL_URL = '/models/vosk-model-small-en-us-0.15.zip';

// --------------------------------------------------------------------------
export type GameEngineUiState = {
  readonly pgn: string;
  readonly fen: string;
  readonly lastMoveSan: string;
  readonly lastInputSanitized: string;
  readonly lastInputEvaluateStatus: GameModelEvaluateStatus;
  readonly lastInputResultMessage: string;
  readonly scoresheet: unknown;
};

export type GameEngineInitOptions = {
  readonly initialSettings?: Partial<ComSettings>;
  readonly onUiStateChange?: (state: GameEngineUiState) => void;
};

export type GameEngine = {
  readonly init: (options: GameEngineInitOptions) => Promise<void>;
  readonly exit: () => Promise<void>;
  readonly mountBoard: (elements: BoardAdapterMountElements) => Promise<void>;
  readonly unmountBoard: () => Promise<void>;
  readonly audioInputToggle: () => Promise<void>;
  readonly audioOutputToggle: () => Promise<void>;
  readonly isAudioInputOn: () => boolean;
  readonly isAudioOutputOn: () => boolean;
};

// --------------------------------------------------------------------------
export function createGameEngine(): GameEngine {
  let settings: ComSettings | undefined;
  let audioInputResources: AudioInputResources | undefined;
  let audioOutputResources: AudioOutputResources | undefined;
  let gameModelResources: GameModelResources | undefined;
  let boardAdapterResources: BoardAdapterResources | undefined;
  let speechRecognizerResources: SpeechRecognizerResources | undefined;
  let pendingBoardMountElements: BoardAdapterMountElements | undefined;
  let onUiStateChange: ((state: GameEngineUiState) => void) | undefined;

  function emitUiState(state: GameEngineUiState): void {
    onUiStateChange?.(state);
  }

  function getResultMessage(result: GameModelEvaluateResult, gameModelResources: GameModelResources): string {
    switch (result.status) {
      case GAME_MODEL_EVALUATE_STATUS_OK:
        return gameModelResources.chess.history().at(-1) ?? 'Move accepted';
      case GAME_MODEL_EVALUATE_STATUS_ILLEGAL:
        return result.message;
      case GAME_MODEL_EVALUATE_STATUS_CONTROL:
        return result.action === GAME_MODEL_CONTROL_ACTION_FLIP ? 'Board flipped' : 'Control action applied';
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

  function requireBoardMounted(): {
    settings: ComSettings;
    audioInputResources: AudioInputResources;
    audioOutputResources: AudioOutputResources;
    gameModelResources: GameModelResources;
    boardAdapterResources: BoardAdapterResources;
    speechRecognizerResources: SpeechRecognizerResources;
  } {
    const coreState = requireInitialized();
    if (!boardAdapterResources) {
      throw new Error('Board adapter is not mounted.');
    }

    return {
      ...coreState,
      boardAdapterResources,
    };
  }

  // --------------------------------------------------------------------------
  async function gameEngineTick(result: string): Promise<void> {
    const { boardAdapterResources, gameModelResources } = requireBoardMounted();
    const readResult = gameModelRead(result);
    const evaluateResult = gameModelEvaluate(gameModelResources, boardAdapterResources, readResult);

    if (evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_OK) {
      await gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_MOVED_OK, {
        type: GAME_MODEL_EVENT_TYPE_MOVED_OK,
        result: evaluateResult,
      });
    }

    if (
      evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_IGNORE ||
      evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_ILLEGAL
    ) {
      await gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_MOVED_INVALID, {
        type: GAME_MODEL_EVENT_TYPE_MOVED_INVALID,
        result: evaluateResult,
      });
    }

    if (evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_CONTROL) {
      await gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_CONTROL, {
        type: GAME_MODEL_EVENT_TYPE_CONTROL,
        result: evaluateResult,
      });
    }

    await gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_EVALUATED, {
      type: GAME_MODEL_EVENT_TYPE_EVALUATED,
      result: evaluateResult,
    });
  }

  // --------------------------------------------------------------------------
  async function recognizerCallbackResult(message: RecognizerMessage): Promise<void> {
    if ('result' in message && 'text' in message.result && message.result.text !== '') {
      await gameEngineTick(message.result.text);
    }
  }

  async function recognizerCallbackError(message: RecognizerMessage): Promise<void> {
    console.error('Err:', message);
  }

  // --------------------------------------------------------------------------
  async function audioInputOn(): Promise<void> {
    const state = requireBoardMounted();

    if (state.audioInputResources.status === AUDIO_INPUT_LISTENING_ON) {
      console.warn(
        '[chess-o-matic][game-engine] WARNING: gameEngineAudioInputOn called when audio input is on: ignoring.'
      );
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

  // --------------------------------------------------------------------------
  async function audioInputOff(): Promise<void> {
    const state = requireInitialized();

    if (state.audioInputResources.status === AUDIO_INPUT_LISTENING_OFF) {
      console.warn(
        '[chess-o-matic][game-engine] WARNING: gameEngineAudioInputOff called when input audio is off: ignoring.'
      );
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

    await exitGameModel(gameModelResources);
    if (isAudioInputOn()) {
      await audioInputOff();
    }
    await exitAudioInput(audioInputResources);
    await exitSpeechRecognizer(speechRecognizerResources);
    await exitAudioOutput(audioOutputResources);
    if (boardAdapterResources) {
      await exitBoardAdapter(boardAdapterResources);
    }

    settings = undefined;
    audioInputResources = undefined;
    audioOutputResources = undefined;
    gameModelResources = undefined;
    boardAdapterResources = undefined;
    speechRecognizerResources = undefined;
    pendingBoardMountElements = undefined;
    onUiStateChange = undefined;
  }

  // --------------------------------------------------------------------------
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
    const state = requireInitialized();
    state.settings.audioOutputOn = !state.settings.audioOutputOn;
  }

  function isAudioOutputOn(): boolean {
    return settings?.audioOutputOn ?? false;
  }

  // --------------------------------------------------------------------------
  async function mountBoard(elements: BoardAdapterMountElements): Promise<void> {
    pendingBoardMountElements = elements;

    if (!gameModelResources) {
      return;
    }

    if (boardAdapterResources) {
      if (isAudioInputOn()) {
        await audioInputOff();
      }
      await exitBoardAdapter(boardAdapterResources);
    }

    boardAdapterResources = await initBoardAdapter(gameModelResources, elements);

    if (settings?.audioInputOn) {
      await audioInputOn();
    }
  }

  async function unmountBoard(): Promise<void> {
    pendingBoardMountElements = undefined;

    if (isAudioInputOn()) {
      await audioInputOff();
    }

    if (boardAdapterResources) {
      await exitBoardAdapter(boardAdapterResources);
      boardAdapterResources = undefined;
    }
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
    const nextSettings = settings;
    const nextAudioOutputResources = audioOutputResources;
    const nextGameModelResources = gameModelResources;

    emitUiState({
      lastInputSanitized: '',
      lastInputEvaluateStatus: GAME_MODEL_EVALUATE_STATUS_IGNORE,
      lastMoveSan: '',
      lastInputResultMessage: 'No moves',
      fen: nextGameModelResources.chess.fen(),
      pgn: nextGameModelResources.chess.pgn(),
      scoresheet: {},
    });

    gameModelEventsAddListener(
      nextGameModelResources,
      GAME_MODEL_EVENT_TYPE_MOVED_OK,
      async (event: GameModelEventMovedOk) => {
        await boardAdapterUpdateMovedOk(
          nextSettings,
          requireBoardMounted().boardAdapterResources,
          nextGameModelResources,
          nextAudioOutputResources,
          event.result
        );
      }
    );

    gameModelEventsAddListener(
      nextGameModelResources,
      GAME_MODEL_EVENT_TYPE_MOVED_INVALID,
      async (event: GameModelEventMovedInvalid) => {
        await boardAdapterUpdateMovedInvalid(
          nextSettings,
          requireBoardMounted().boardAdapterResources,
          nextGameModelResources,
          nextAudioOutputResources,
          event.result
        );
      }
    );

    gameModelEventsAddListener(
      nextGameModelResources,
      GAME_MODEL_EVENT_TYPE_CONTROL,
      async (event: GameModelEventControl) => {
        await boardAdapterUpdateControl(
          nextSettings,
          requireBoardMounted().boardAdapterResources,
          nextGameModelResources,
          nextAudioOutputResources,
          event.result
        );
      }
    );

    gameModelEventsAddListener(
      nextGameModelResources,
      GAME_MODEL_EVENT_TYPE_VIEW_CHANGED,
      async (event: GameModelEventViewChanged) => {
        const evaluateResult = gameModelEvaluate(
          nextGameModelResources,
          requireBoardMounted().boardAdapterResources,
          typeof event.move === 'string'
            ? {
                status: GAME_INPUT_PARSE_STATUS_OK_SAN,
                input: event.move,
                sanitized: event.move,
                parsed: event.move,
                san: { candidates: [event.move] },
              }
            : {
                status: GAME_INPUT_PARSE_STATUS_OK_COORDS,
                input: JSON.stringify(event.move),
                sanitized: `${event.move[0]} to ${event.move[1]}`,
                parsed: JSON.stringify(event.move),
                coords: event.move,
              }
        );

        if (evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_OK) {
          await boardAdapterUpdateMovedSoundsOk(nextSettings, nextAudioOutputResources, evaluateResult);
        }

        await gameModelEventsNotifyListeners(nextGameModelResources, GAME_MODEL_EVENT_TYPE_EVALUATED, {
          type: GAME_MODEL_EVENT_TYPE_EVALUATED,
          result: evaluateResult,
        });
      }
    );

    gameModelEventsAddListener(
      nextGameModelResources,
      GAME_MODEL_EVENT_TYPE_EVALUATED,
      async (event: GameModelEventEvaluated) => {
        emitUiState({
          lastInputSanitized: event.result.sanitized,
          lastMoveSan: nextGameModelResources.chess.history().at(-1) ?? '',
          lastInputEvaluateStatus: event.result.status,
          lastInputResultMessage: getResultMessage(event.result, nextGameModelResources),
          fen: nextGameModelResources.chess.fen(),
          pgn: nextGameModelResources.chess.pgn(),
          scoresheet: [...(parsePgn(nextGameModelResources.chess.pgn())?.[0]?.moves?.mainline() ?? [])],
        });
      }
    );

    if (pendingBoardMountElements) {
      await mountBoard(pendingBoardMountElements);
    }
  }

  return {
    init,
    exit,
    mountBoard,
    unmountBoard,
    audioInputToggle,
    audioOutputToggle,
    isAudioInputOn,
    isAudioOutputOn,
  };
}
