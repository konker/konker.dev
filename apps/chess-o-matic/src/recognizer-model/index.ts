import { createModel, KaldiRecognizer } from "vosk-browser";
import { AUDIO_SAMPLE_RATE } from '../audio-resources';

export async function initRecognizerModel(
  modelUrl: string,
  grammar: Array<string>,
): Promise<KaldiRecognizer> {
  console.log("Loading Vosk model...");

  // Load the model
  const model = await createModel(modelUrl);
  console.log("Model loaded successfully");

  // Create recognizer with or without grammar
  const recognizer = new model.KaldiRecognizer(AUDIO_SAMPLE_RATE, JSON.stringify(grammar));
  console.log(`Recognizer created with grammar (${grammar.length} phrases)`);

  return recognizer;
}

export function exitRecognizerModel(recognizer: KaldiRecognizer): void {
  // Retrieve the final result before stopping (triggers a result event)
  recognizer.retrieveFinalResult();
}