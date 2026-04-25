import type { KaldiRecognizer, Model } from 'vosk-browser';
import { createModel } from 'vosk-browser';

// --------------------------------------------------------------------------
export const SPEECH_RECOGNIZER_STATUS_ACTIVE = 'active' as const;
export const SPEECH_RECOGNIZER_STATUS_INACTIVE = 'inactive' as const;

export type SpeechRecognizerResourcesActive = {
  readonly status: typeof SPEECH_RECOGNIZER_STATUS_ACTIVE;
  readonly modelUrl: string;
  readonly model: Model;
  readonly recognizer: KaldiRecognizer;
};

export type SpeechRecognizerResourcesInactive = {
  readonly status: typeof SPEECH_RECOGNIZER_STATUS_INACTIVE;
  readonly modelUrl: string;
  readonly model: Model;
};

export type SpeechRecognizerResources = SpeechRecognizerResourcesActive | SpeechRecognizerResourcesInactive;

// --------------------------------------------------------------------------
export async function initSpeechRecognizer(modelUrl: string): Promise<SpeechRecognizerResourcesInactive> {
  console.log(`[chess-o-matic-3000][speech-recognizer] Loading Vosk model at ${modelUrl}...`);
  const model = await createModel(modelUrl);
  console.log('[chess-o-matic-3000][speech-recognizer] Model loaded successfully');

  return {
    status: SPEECH_RECOGNIZER_STATUS_INACTIVE,
    modelUrl,
    model,
  };
}

// --------------------------------------------------------------------------
export async function exitSpeechRecognizer(speechRecognizerResources: SpeechRecognizerResources): Promise<void> {
  const stoppedSpeechRecognizerResources = await stopSpeechRecognizer(speechRecognizerResources);
  stoppedSpeechRecognizerResources.model.terminate();
}

// --------------------------------------------------------------------------
export async function startSpeechRecognizer(
  speechRecognizerResources: SpeechRecognizerResources,
  sampleRate: number,
  grammar: ReadonlyArray<string>
): Promise<SpeechRecognizerResourcesActive> {
  if (speechRecognizerResources.status === SPEECH_RECOGNIZER_STATUS_ACTIVE) {
    console.warn(
      '[chess-o-matic-3000][speech-recognizer] WARNING: startSpeechRecognizer call with active speech recognizer resources: ignoring'
    );
    return speechRecognizerResources;
  }

  const recognizer = new speechRecognizerResources.model.KaldiRecognizer(sampleRate, JSON.stringify(grammar));
  console.log(`[chess-o-matic-3000][speech-recognizer] Recognizer created with grammar (${grammar.length} phrases)`);

  return {
    status: SPEECH_RECOGNIZER_STATUS_ACTIVE,
    modelUrl: speechRecognizerResources.modelUrl,
    model: speechRecognizerResources.model,
    recognizer,
  };
}

// --------------------------------------------------------------------------
export async function stopSpeechRecognizer(
  speechRecognizerResources: SpeechRecognizerResources
): Promise<SpeechRecognizerResourcesInactive> {
  if (speechRecognizerResources.status === SPEECH_RECOGNIZER_STATUS_ACTIVE) {
    speechRecognizerResources.recognizer.remove();
  }

  return {
    status: SPEECH_RECOGNIZER_STATUS_INACTIVE,
    modelUrl: speechRecognizerResources.modelUrl,
    model: speechRecognizerResources.model,
  };
}
