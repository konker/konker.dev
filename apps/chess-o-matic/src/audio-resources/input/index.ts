// --------------------------------------------------------------------------
export const AUDIO_INPUT_LISTENING_ON = 'listening' as const;
export const AUDIO_INPUT_LISTENING_OFF = 'not-listening' as const;

export type AudioInputResourcesListeningOn = {
  status: typeof AUDIO_INPUT_LISTENING_ON;
  audioContext: AudioContext;
  mediaStream: MediaStream;
  workletNode: AudioWorkletNode;
};

export type AudioInputResourcesListeningOff = {
  status: typeof AUDIO_INPUT_LISTENING_OFF;
  audioContext: null;
  mediaStream: null;
  workletNode: null;
};

export type AudioInputResources = AudioInputResourcesListeningOn | AudioInputResourcesListeningOff;

// --------------------------------------------------------------------------
export const AUDIO_INPUT_RESOURCES_NOT_LISTENING: AudioInputResourcesListeningOff = {
  status: AUDIO_INPUT_LISTENING_OFF,
  audioContext: null,
  mediaStream: null,
  workletNode: null,
} as const;

// --------------------------------------------------------------------------
export async function initAudioInput(): Promise<AudioInputResourcesListeningOff> {
  return AUDIO_INPUT_RESOURCES_NOT_LISTENING;
}

// --------------------------------------------------------------------------
export async function exitAudioInput(audioInputResources: AudioInputResources): Promise<void> {
  await stopAudioInput(audioInputResources);
}

// --------------------------------------------------------------------------
export async function startAudioInput(): Promise<AudioInputResourcesListeningOn> {
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

  console.log('Started listening');
  return {
    status: AUDIO_INPUT_LISTENING_ON,
    workletNode,
    audioContext,
    mediaStream,
  };
}

// --------------------------------------------------------------------------
export async function stopAudioInput(
  audioInputResources: AudioInputResources
): Promise<AudioInputResourcesListeningOff> {
  if (audioInputResources.status === AUDIO_INPUT_LISTENING_OFF) {
    console.warn('[chesss-o-matic][audio-input] WARN: stopAudioInput called when not listening: ignoring.');
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

  console.log('Stopped listening');
  return AUDIO_INPUT_RESOURCES_NOT_LISTENING;
}
