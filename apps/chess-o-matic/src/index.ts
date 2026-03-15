import type { KaldiRecognizer } from 'vosk-browser';

import type { AudioResources } from './audio-resources';
import { exitAudioResources, initAudioResources } from './audio-resources';
import type { GameModelResources } from './game-model';
import { exitGameModel, initGameModel } from './game-model';
import {
  GAME_MODEL_EVALUATE_STATUS_CONTROL,
  GAME_MODEL_EVALUATE_STATUS_OK,
  gameModelEvaluate,
} from './game-model/evaluate';
import type { GameModelEventControl, GameModelEventMoved, GameModelEventViewChanged } from './game-model/events';
import {
  GAME_MODEL_EVENT_TYPE_CONTROL,
  GAME_MODEL_EVENT_TYPE_EVALUATED,
  GAME_MODEL_EVENT_TYPE_MOVED,
  GAME_MODEL_EVENT_TYPE_VIEW_CHANGED,
  gameModelEventsAddListener,
  gameModelEventsNotifyListeners,
} from './game-model/events';
import { GAME_INPUT_PARSE_STATUS_OK_COORDS, gameModelRead } from './game-model/read';
import type { GameViewResources } from './game-view';
import { exitGameView, gameViewUpdateControl, gameViewUpdateMoved, initGameView } from './game-view';
import { grammarSanMap } from './grammar/chess-grammar-san-map-en.js';
import { exitRecognizerModel, initRecognizerModel } from './recognizer-model';
import MODEL_URL from './recognizer-model/vosk-model-small-en-us-0.15.zip?url';

let recognizer: KaldiRecognizer;
let audioResources: AudioResources;
let gameModelResources: GameModelResources;
let gameViewResources: GameViewResources;

export function tick(result: string) {
  const readResult = gameModelRead(result);
  const evaluateResult = gameModelEvaluate(gameModelResources, readResult);

  // Notify everything that has happened
  gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_EVALUATED, {
    type: GAME_MODEL_EVENT_TYPE_EVALUATED,
    result: evaluateResult,
  });

  // Notify if a legal move was made
  if (evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_OK) {
    gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_MOVED, {
      type: GAME_MODEL_EVENT_TYPE_MOVED,
      result: evaluateResult,
    });
  }

  // Notify if a control action was made
  if (evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_CONTROL) {
    gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_CONTROL, {
      type: GAME_MODEL_EVENT_TYPE_CONTROL,
      result: evaluateResult,
    });
  }

  console.log('R: ', result);
  console.log('Rh: ', evaluateResult);
  console.log('Ra: ', gameModelResources.chess.ascii());
  console.log('Rp: ', gameModelResources.chess.pgn());
  console.log('Rf: ', gameModelResources.chess.fen());
}

export async function init(boardEl: HTMLElement, inputEl: HTMLElement, pgnEl: HTMLElement) {
  console.log('INIT');
  audioResources = await initAudioResources();
  recognizer = await initRecognizerModel(MODEL_URL, Object.keys(grammarSanMap), audioResources.audioContext.sampleRate);
  gameModelResources = initGameModel();
  gameViewResources = initGameView(gameModelResources, boardEl, inputEl, pgnEl);

  // Pipe audio data from worklet to recognizer
  audioResources.workletNode.port.onmessage = (event) => {
    if (event.data.type === 'audio' && audioResources.isListening) {
      const audioData = event.data.data;
      // Send Float32Array directly to recognizer
      recognizer.acceptWaveformFloat(audioData, audioResources.audioContext.sampleRate);
    }
  };

  recognizer.on('result', (message) => {
    if ('result' in message && 'text' in message.result && message.result.text !== '') {
      tick(message.result.text);
    }
  });

  /*[XXX: noisy]
  recognizer.on('partialresult', (message) => {
    if ('result' in message && 'partial' in message.result && message.result.partial !== '') {
      console.log('P: ', message.result.partial);
    }
  });
  */

  recognizer.on('error', (message) => {
    console.error('Err:', message);
  });

  gameModelEventsAddListener(gameModelResources, GAME_MODEL_EVENT_TYPE_MOVED, (event: GameModelEventMoved) => {
    gameViewUpdateMoved(gameViewResources, gameModelResources, event.result);
  });

  gameModelEventsAddListener(gameModelResources, GAME_MODEL_EVENT_TYPE_CONTROL, (event: GameModelEventControl) => {
    gameViewUpdateControl(gameViewResources, gameModelResources, event.result);
  });

  gameModelEventsAddListener(
    gameModelResources,
    GAME_MODEL_EVENT_TYPE_VIEW_CHANGED,
    (event: GameModelEventViewChanged) => {
      gameModelEvaluate(gameModelResources, {
        status: GAME_INPUT_PARSE_STATUS_OK_COORDS,
        sanitized: `${event.move[0]} to ${event.move[1]}`,
        coords: event.move,
      });
    }
  );
}

export async function exit() {
  console.log('EXIT');
  exitGameModel(gameModelResources);
  audioResources = exitAudioResources(audioResources);
  exitRecognizerModel(recognizer);
  exitGameView(gameViewResources);
}
