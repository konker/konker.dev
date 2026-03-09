// --------------------------------------------------------------------------
export type AudioResourcesListening = {
  isListening: true;
  audioContext: AudioContext;
  mediaStream: MediaStream;
  workletNode: AudioWorkletNode;
};

export type AudioResourcesNotListening = {
  isListening: false;
  audioContext: null;
  mediaStream: null;
  workletNode: null;
};

export type AudioResources = AudioResourcesListening | AudioResourcesNotListening;

// --------------------------------------------------------------------------
export async function initAudioResources(): Promise<AudioResourcesListening> {
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
export function exitAudioResources(audioResources: AudioResources): AudioResourcesNotListening {
  if (!audioResources.isListening) {
    return audioResources;
  }

  // Clean up audio resources
  if (audioResources.workletNode) {
    audioResources.workletNode.disconnect();
    audioResources.workletNode.port.onmessage = null;
  }

  if (audioResources.audioContext) {
    void audioResources.audioContext.close();
  }

  if (audioResources.mediaStream) {
    audioResources.mediaStream.getTracks().forEach((track) => track.stop());
  }

  console.log('Stopped listening');

  return {
    isListening: false,
    audioContext: null,
    mediaStream: null,
    workletNode: null,
  };
}
