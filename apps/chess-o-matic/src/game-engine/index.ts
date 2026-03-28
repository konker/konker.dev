import type { RecognizerMessage } from 'vosk-browser/dist/interfaces';

import type { AudioInputResources } from '../audio-resources/input';
import {
  AUDIO_INPUT_LISTENING_OFF,
  AUDIO_INPUT_LISTENING_ON,
  exitAudioInput,
  initAudioInput,
  startAudioInput,
  stopAudioInput,
} from '../audio-resources/input';
import MODEL_URL from '../audio-resources/input/vosk-model-small-en-us-0.15.zip?url';
import type { AudioOutputResources } from '../audio-resources/output';
import { exitAudioOutput, initAudioOutput } from '../audio-resources/output';
import type { GameModelResources } from '../game-model';
import { exitGameModel, initGameModel } from '../game-model';
import {
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
import type { GameViewResources } from '../game-view';
import {
  exitGameView,
  gameViewUpdateControl,
  gameViewUpdateMovedInvalid,
  gameViewUpdateMovedOk,
  gameViewUpdateMovedSoundsOk,
  initGameView,
} from '../game-view';
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

// --------------------------------------------------------------------------
let settings: ComSettings;
let audioInputResources: AudioInputResources;
let audioOutputResources: AudioOutputResources;
let gameModelResources: GameModelResources;
let gameViewResources: GameViewResources;
let speechRecognizerResources: SpeechRecognizerResources;

// --------------------------------------------------------------------------
export async function gameEngineInit(
  boardEl: HTMLElement,
  inputEl: HTMLElement,
  pgnEl: HTMLElement,
  initialSettings?: Partial<ComSettings>
) {
  console.log('INIT');
  settings = await initComSettings(initialSettings);
  audioInputResources = await initAudioInput();
  audioOutputResources = await initAudioOutput();
  gameModelResources = await initGameModel();
  gameViewResources = await initGameView(gameModelResources, boardEl, inputEl, pgnEl);
  speechRecognizerResources = await initSpeechRecognizer(MODEL_URL);

  gameModelEventsAddListener(
    gameModelResources,
    GAME_MODEL_EVENT_TYPE_MOVED_OK,
    async (event: GameModelEventMovedOk) => {
      await gameViewUpdateMovedOk(settings, gameViewResources, gameModelResources, audioOutputResources, event.result);
    }
  );

  gameModelEventsAddListener(
    gameModelResources,
    GAME_MODEL_EVENT_TYPE_MOVED_INVALID,
    async (event: GameModelEventMovedInvalid) => {
      await gameViewUpdateMovedInvalid(
        settings,
        gameViewResources,
        gameModelResources,
        audioOutputResources,
        event.result
      );
    }
  );

  gameModelEventsAddListener(
    gameModelResources,
    GAME_MODEL_EVENT_TYPE_CONTROL,
    async (event: GameModelEventControl) => {
      await gameViewUpdateControl(gameViewResources, gameModelResources, event.result);
    }
  );

  gameModelEventsAddListener(
    gameModelResources,
    GAME_MODEL_EVENT_TYPE_VIEW_CHANGED,
    async (event: GameModelEventViewChanged) => {
      const evaluateResult = gameModelEvaluate(
        gameModelResources,
        gameViewResources,
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
        await gameViewUpdateMovedSoundsOk(
          settings,
          gameViewResources,
          gameModelResources,
          audioOutputResources,
          evaluateResult
        );
      }

      await gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_EVALUATED, {
        type: GAME_MODEL_EVENT_TYPE_EVALUATED,
        result: evaluateResult,
      });
    }
  );

  gameModelEventsAddListener(
    gameModelResources,
    GAME_MODEL_EVENT_TYPE_EVALUATED,
    async (event: GameModelEventEvaluated) => {
      console.log('Ev: ', event);
      console.log('Ra: ', gameModelResources.chess.ascii());
      console.log('Rp: ', gameModelResources.chess.pgn());
      console.log('Rf: ', gameModelResources.chess.fen());

      gameViewResources.inputEl.innerHTML = `${event.result.sanitized} - ${event.result.status}`;
      gameViewResources.pgnEl.innerHTML = gameModelResources.chess.pgn();
    }
  );

  if (settings.audioInputOn) {
    await gameEngineAudioInputOn();
  }
  if (settings.audioOutputOn) {
    await gameEngineAudioOutputOn();
  }
}

// --------------------------------------------------------------------------
export async function gameEngineExit() {
  console.log('EXIT');
  await exitGameModel(gameModelResources);
  await gameEngineAudioInputOff();
  await exitAudioInput(audioInputResources);
  await exitSpeechRecognizer(speechRecognizerResources);
  await exitAudioOutput(audioOutputResources);
  await exitGameView(gameViewResources);
}

// --------------------------------------------------------------------------
export async function gameEngineTick(result: string) {
  const readResult = gameModelRead(result);
  const evaluateResult = gameModelEvaluate(gameModelResources, gameViewResources, readResult);

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
export const recognizerCallbackResult = async (message: RecognizerMessage) => {
  if ('result' in message && 'text' in message.result && message.result.text !== '') {
    await gameEngineTick(message.result.text);
  }
};

export const recognizerCallbackError = async (message: RecognizerMessage) => {
  console.error('Err:', message);
};

// --------------------------------------------------------------------------
export async function gameEngineAudioInputOn() {
  if (audioInputResources.status === AUDIO_INPUT_LISTENING_ON) {
    console.warn(
      '[chess-o-matic][game-engine] WARNING: gameEngineAudioInputOn called when audio input is on: ignoring.'
    );
    settings.audioInputOn = true;
    return;
  }

  audioInputResources = await startAudioInput();

  const nextSpeechRecognizerResources = await startSpeechRecognizer(
    speechRecognizerResources,
    audioInputResources.audioContext.sampleRate,
    chessGrammar
  );

  audioInputResources.workletNode.port.onmessage = (event) => {
    if (event.data.type === 'audio' && audioInputResources.status === AUDIO_INPUT_LISTENING_ON) {
      const audioData = event.data.data;
      nextSpeechRecognizerResources.recognizer.acceptWaveformFloat(
        audioData,
        audioInputResources.audioContext.sampleRate
      );
    }
  };

  nextSpeechRecognizerResources.recognizer.on('result', recognizerCallbackResult);
  nextSpeechRecognizerResources.recognizer.on('error', recognizerCallbackError);

  speechRecognizerResources = nextSpeechRecognizerResources;
  settings.audioInputOn = true;
}

// --------------------------------------------------------------------------
export async function gameEngineAudioInputOff(): Promise<void> {
  if (audioInputResources.status === AUDIO_INPUT_LISTENING_OFF) {
    console.warn(
      '[chess-o-matic][game-engine] WARNING: gameEngineAudioInputOff called when input audio is off: ignoring.'
    );
    return;
  }

  audioInputResources.workletNode.port.onmessage = null;
  speechRecognizerResources = await stopSpeechRecognizer(speechRecognizerResources);
  audioInputResources = await stopAudioInput(audioInputResources);
  settings.audioInputOn = false;
}

// --------------------------------------------------------------------------
export function gameEngineIsAudioInputOn(): boolean {
  return audioInputResources.status === AUDIO_INPUT_LISTENING_ON;
}

// --------------------------------------------------------------------------
export async function gameEngineAudioInputToggle(): Promise<void> {
  if (gameEngineIsAudioInputOn()) {
    return await gameEngineAudioInputOff();
  }
  return await gameEngineAudioInputOn();
}

// --------------------------------------------------------------------------
export async function gameEngineAudioOutputOn() {
  settings.audioOutputOn = true;
}

// --------------------------------------------------------------------------
export async function gameEngineAudioOutputOff(): Promise<void> {
  settings.audioOutputOn = false;
}

// --------------------------------------------------------------------------
export function gameEngineIsAudioOutputOn(): boolean {
  return settings.audioOutputOn;
}

// --------------------------------------------------------------------------
export async function gameEngineAudioOutputToggle(): Promise<void> {
  settings.audioOutputOn = !settings.audioOutputOn;
}
