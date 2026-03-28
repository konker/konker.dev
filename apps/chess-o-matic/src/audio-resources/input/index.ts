// --------------------------------------------------------------------------
import type { KaldiRecognizer } from 'vosk-browser';
import { createModel } from 'vosk-browser';

export type AudioInputResourcesListening = {
  isListening: true;
  audioContext: AudioContext;
  mediaStream: MediaStream;
  workletNode: AudioWorkletNode;
  recognizer: KaldiRecognizer;
};

export type AudioInputResourcesNotListening = {
  isListening: false;
  audioContext: null;
  mediaStream: null;
  workletNode: null;
  recognizer: null;
};

export type AudioInputResources = AudioInputResourcesListening | AudioInputResourcesNotListening;

// --------------------------------------------------------------------------
export async function initAudioInputResources(
  modelUrl: string,
  grammar: ReadonlyArray<string>
): Promise<AudioInputResourcesListening> {
  // Request microphone access
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  // Create audio context at the hardware's native sample rate to avoid
  // a mismatch with the media stream (browsers ignore sampleRate constraints)
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(mediaStream);

  // Load and create an AudioWorklet processor
  await audioContext.audioWorklet.addModule(new URL('./audio-input-capture.worklet.ts', import.meta.url).href);

  const workletNode = new AudioWorkletNode(audioContext, 'audio-input-capture');

  source.connect(workletNode);
  workletNode.connect(audioContext.destination);

  console.log(`Loading Vosk model at ${modelUrl}...`);

  // Load the model
  const model = await createModel(modelUrl);
  console.log('Model loaded successfully');

  // Create recognizer with or without grammar
  const recognizer = new model.KaldiRecognizer(audioContext.sampleRate, JSON.stringify(grammar));
  console.log(`Recognizer created with grammar (${grammar.length} phrases)`);

  const isListening = true;

  return {
    workletNode,
    audioContext,
    mediaStream,
    isListening,
    recognizer,
  };
}

// --------------------------------------------------------------------------
export function exitAudioInputResources(audioInputResources: AudioInputResources): AudioInputResourcesNotListening {
  if (!audioInputResources.isListening) {
    return audioInputResources;
  }

  // Clean up audio resources
  if (audioInputResources.workletNode) {
    audioInputResources.workletNode.disconnect();
    audioInputResources.workletNode.port.onmessage = null;
  }

  if (audioInputResources.audioContext) {
    void audioInputResources.audioContext.close();
  }

  if (audioInputResources.mediaStream) {
    audioInputResources.mediaStream.getTracks().forEach((track) => track.stop());
  }
  // Retrieve the final result before stopping (triggers a result event)
  audioInputResources.recognizer.retrieveFinalResult();

  console.log('Stopped listening');

  return {
    isListening: false,
    audioContext: null,
    mediaStream: null,
    workletNode: null,
    recognizer: null,
  };
}
