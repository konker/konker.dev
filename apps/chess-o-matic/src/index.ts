import type { KaldiRecognizer } from 'vosk-browser';

import type { AudioResources } from './audio-resources';
import { exitAudioResources, initAudioResources } from './audio-resources';
import type { GameModelResources } from './game-model';
import { exitGameModel, handleInput, initGameModel } from './game-model';
import type { GameViewResources } from './game-view';
import { exitGameView, handleGameViewUpdate, initGameView } from './game-view';
import { grammarSanMap } from './grammar/chess-grammar-san-map-en.js';
import { exitRecognizerModel, initRecognizerModel } from './recognizer-model';
import MODEL_URL from './recognizer-model/vosk-model-small-en-us-0.15.zip?url';

let recognizer: KaldiRecognizer;
let audioResources: AudioResources;
let gameModelResources: GameModelResources;
let gameViewResources: GameViewResources;

export async function init(boardEl: HTMLElement, inputEl: HTMLElement, pgnEl: HTMLElement) {
  console.log('INIT');
  audioResources = await initAudioResources();
  recognizer = await initRecognizerModel(MODEL_URL, Object.keys(grammarSanMap), audioResources.audioContext.sampleRate);
  gameModelResources = initGameModel();
  gameViewResources = initGameView(boardEl, inputEl, pgnEl);

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
      const handleInputResult = handleInput(gameModelResources, message.result.text);
      handleGameViewUpdate(gameViewResources, gameModelResources, handleInputResult);

      console.log('R: ', message.result.text);
      console.log('Rh: ', handleInputResult);
      console.log('Ra: ', gameModelResources.chess.ascii());
      console.log('Rp: ', gameModelResources.chess.pgn());
      console.log('Rf: ', gameModelResources.chess.fen());
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
}

export async function exit() {
  console.log('EXIT');
  exitGameModel(gameModelResources);
  audioResources = exitAudioResources(audioResources);
  exitRecognizerModel(recognizer);
  exitGameView(gameViewResources);
}
