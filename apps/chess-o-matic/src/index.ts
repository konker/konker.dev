import type { KaldiRecognizer } from 'vosk-browser';

import type { AudioInputResources } from './audio-resources/input';
import { exitAudioInputResources, initAudioInputResources } from './audio-resources/input';
import type { AudioOutputResources } from './audio-resources/output';
import { exitAudioOutputResources, initAudioOutputResources } from './audio-resources/output';
import type { GameModelResources } from './game-model';
import { exitGameModel, initGameModel } from './game-model';
import {
  GAME_MODEL_EVALUATE_STATUS_CONTROL,
  GAME_MODEL_EVALUATE_STATUS_IGNORE,
  GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
  GAME_MODEL_EVALUATE_STATUS_OK,
  gameModelEvaluate,
} from './game-model/evaluate.js';
import type {
  GameModelEventControl,
  GameModelEventEvaluated,
  GameModelEventMovedInvalid,
  GameModelEventMovedOk,
  GameModelEventViewChanged,
} from './game-model/events.js';
import { GAME_MODEL_EVENT_TYPE_MOVED_INVALID } from './game-model/events.js';
import {
  GAME_MODEL_EVENT_TYPE_CONTROL,
  GAME_MODEL_EVENT_TYPE_EVALUATED,
  GAME_MODEL_EVENT_TYPE_MOVED_OK,
  GAME_MODEL_EVENT_TYPE_VIEW_CHANGED,
  gameModelEventsAddListener,
  gameModelEventsNotifyListeners,
} from './game-model/events.js';
import { GAME_INPUT_PARSE_STATUS_OK_COORDS, GAME_INPUT_PARSE_STATUS_OK_SAN, gameModelRead } from './game-model/read.js';
import type { GameViewResources } from './game-view';
import { gameViewUpdateMovedInvalid } from './game-view';
import { exitGameView, gameViewUpdateControl, gameViewUpdateMovedOk, initGameView } from './game-view';
import { chessGrammar } from './grammar/chess-grammar-en.js';
import { exitRecognizerModel, initRecognizerModel } from './recognizer-model';
import MODEL_URL from './recognizer-model/vosk-model-small-en-us-0.15.zip?url';
import { ComSettings } from './settings';

let recognizer: KaldiRecognizer;
let audioInputResources: AudioInputResources;
let audioOutputResources: AudioOutputResources;
let gameModelResources: GameModelResources;
let gameViewResources: GameViewResources;
let settings: ComSettings;

export function tick(result: string) {
  const readResult = gameModelRead(result);
  const evaluateResult = gameModelEvaluate(gameModelResources, gameViewResources, readResult);

  // Notify if a legal move was made
  if (evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_OK) {
    gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_MOVED_OK, {
      type: GAME_MODEL_EVENT_TYPE_MOVED_OK,
      result: evaluateResult,
    });
  }

  // Notify if an invalid move was made
  if (
    evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_IGNORE ||
    evaluateResult.status === GAME_MODEL_EVALUATE_STATUS_ILLEGAL
  ) {
    gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_MOVED_INVALID, {
      type: GAME_MODEL_EVENT_TYPE_MOVED_INVALID,
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

  // Notify everything that has happened
  gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_EVALUATED, {
    type: GAME_MODEL_EVENT_TYPE_EVALUATED,
    result: evaluateResult,
  });
}

export async function init(boardEl: HTMLElement, inputEl: HTMLElement, pgnEl: HTMLElement) {
  console.log('INIT');
  settings = new ComSettings();
  audioInputResources = await initAudioInputResources();
  audioOutputResources = await initAudioOutputResources();
  recognizer = await initRecognizerModel(MODEL_URL, chessGrammar, audioInputResources.audioContext.sampleRate);
  gameModelResources = initGameModel();
  gameViewResources = initGameView(gameModelResources, boardEl, inputEl, pgnEl);

  // Pipe audio data from worklet to recognizer
  audioInputResources.workletNode.port.onmessage = (event) => {
    if (event.data.type === 'audio' && audioInputResources.isListening) {
      const audioData = event.data.data;
      // Send Float32Array directly to recognizer
      recognizer.acceptWaveformFloat(audioData, audioInputResources.audioContext.sampleRate);
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

  // If a valid move has been made, update the view
  gameModelEventsAddListener(
    gameModelResources,
    GAME_MODEL_EVENT_TYPE_MOVED_OK,
    async (event: GameModelEventMovedOk) => {
      await gameViewUpdateMovedOk(settings, gameViewResources, gameModelResources, audioOutputResources, event.result);
    }
  );

  // If a valid move has been made, update the view
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

  // If a valid control command has been received, notify the view
  gameModelEventsAddListener(
    gameModelResources,
    GAME_MODEL_EVENT_TYPE_CONTROL,
    async (event: GameModelEventControl) => {
      gameViewUpdateControl(gameViewResources, gameModelResources, event.result);
    }
  );

  // If the view has made an update, make sure the game model is in sync
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

      // Notify everything that has happened
      gameModelEventsNotifyListeners(gameModelResources, GAME_MODEL_EVENT_TYPE_EVALUATED, {
        type: GAME_MODEL_EVENT_TYPE_EVALUATED,
        result: evaluateResult,
      });
    }
  );

  // If something has happened, update the UI
  gameModelEventsAddListener(
    gameModelResources,
    GAME_MODEL_EVENT_TYPE_EVALUATED,
    async (event: GameModelEventEvaluated) => {
      console.log('Ra: ', gameModelResources.chess.ascii());
      console.log('Rp: ', gameModelResources.chess.pgn());
      console.log('Rf: ', gameModelResources.chess.fen());

      gameViewResources.inputEl.innerHTML = `${event.result.sanitized} - ${event.result.status}`;
      gameViewResources.pgnEl.innerHTML = gameModelResources.chess.pgn();
    }
  );
}

export async function exit() {
  console.log('EXIT');
  exitGameModel(gameModelResources);
  audioInputResources = exitAudioInputResources(audioInputResources);
  audioOutputResources = exitAudioOutputResources(audioOutputResources);
  exitRecognizerModel(recognizer);
  exitGameView(gameViewResources);
}
