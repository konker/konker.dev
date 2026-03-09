import type { KaldiRecognizer } from 'vosk-browser';
import { createModel } from 'vosk-browser';

export async function initRecognizerModel(
  modelUrl: string,
  grammar: ReadonlyArray<string>,
  sampleRate: number
): Promise<KaldiRecognizer> {
  console.log(`Loading Vosk model at ${modelUrl}...`);

  // Load the model
  const model = await createModel(modelUrl);
  console.log('Model loaded successfully');

  // Create recognizer with or without grammar
  const recognizer = new model.KaldiRecognizer(sampleRate, JSON.stringify(grammar));
  console.log(`Recognizer created with grammar (${grammar.length} phrases)`);

  return recognizer;
}

export function exitRecognizerModel(recognizer: KaldiRecognizer): void {
  // Retrieve the final result before stopping (triggers a result event)
  recognizer.retrieveFinalResult();
}
