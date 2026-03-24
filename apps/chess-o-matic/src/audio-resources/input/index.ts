// --------------------------------------------------------------------------
export type AudioInputResourcesListening = {
  isListening: true;
  audioContext: AudioContext;
  mediaStream: MediaStream;
  workletNode: AudioWorkletNode;
};

export type AudioInputResourcesNotListening = {
  isListening: false;
  audioContext: null;
  mediaStream: null;
  workletNode: null;
};

export type AudioInputResources = AudioInputResourcesListening | AudioInputResourcesNotListening;

// --------------------------------------------------------------------------
export async function initAudioInputResources(): Promise<AudioInputResourcesListening> {
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

  const isListening = true;

  return {
    workletNode,
    audioContext,
    mediaStream,
    isListening,
  };
}

// --------------------------------------------------------------------------
export function exitAudioInputResources(audioOutputResources: AudioInputResources): AudioInputResourcesNotListening {
  if (!audioOutputResources.isListening) {
    return audioOutputResources;
  }

  // Clean up audio resources
  if (audioOutputResources.workletNode) {
    audioOutputResources.workletNode.disconnect();
    audioOutputResources.workletNode.port.onmessage = null;
  }

  if (audioOutputResources.audioContext) {
    void audioOutputResources.audioContext.close();
  }

  if (audioOutputResources.mediaStream) {
    audioOutputResources.mediaStream.getTracks().forEach((track) => track.stop());
  }

  console.log('Stopped listening');

  return {
    isListening: false,
    audioContext: null,
    mediaStream: null,
    workletNode: null,
  };
}
