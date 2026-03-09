import type { KaldiRecognizer } from 'vosk-browser';

import type { AudioResources } from './audio-resources';
import { exitAudioResources, initAudioResources } from './audio-resources';
import type { GameModelResources } from './game-model';
import { exitGameModel, handleInput, initGameModel } from './game-model';
import { grammarSanMap } from './grammar/chess-grammar-san-map-en.js';
import { exitRecognizerModel, initRecognizerModel } from './recognizer-model';
import MODEL_URL from './recognizer-model/vosk-model-small-en-us-0.15.zip?url';

let recognizer: KaldiRecognizer;
let audioResources: AudioResources;
let gameModelResources: GameModelResources;

export async function init() {
  console.log('INIT');
  audioResources = await initAudioResources();
  recognizer = await initRecognizerModel(MODEL_URL, Object.keys(grammarSanMap), audioResources.audioContext.sampleRate);
  gameModelResources = initGameModel();

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
      console.log('R: ', message.result.text);
      const handleResult = handleInput(gameModelResources, message.result.text);
      console.log('Rh: ', handleResult);
      console.log('Ra: ', gameModelResources.chess.ascii());
      console.log('Rp: ', gameModelResources.chess.pgn());
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
}
