import { exitRecognizerModel, initRecognizerModel } from "./recognizer-model";
import {
  AudioResources,
  exitAudioResources,
  initAudioResources,
} from "./audio-resources";
import { KaldiRecognizer } from "vosk-browser";

const MODEL_URL = "./recognizer-model/vosk-model-small-en-us-0.15.zip";

let recognizer: KaldiRecognizer;
let audioResources: AudioResources;

export async function init(grammar: Array<string>) {
  console.log("INIT");
  audioResources = await initAudioResources();
  recognizer = await initRecognizerModel(MODEL_URL, grammar);

  // Pipe audio data from worklet to recognizer
  audioResources.workletNode.port.onmessage = (event) => {
    if (event.data.type === "audio" && audioResources.isListening) {
      const audioData = event.data.data;
      // Send Float32Array directly to recognizer
      recognizer.acceptWaveformFloat(
        audioData,
        audioResources.audioContext.sampleRate,
      );
    }
  };

  recognizer.on("result", (message) => {
    if ("result" in message && "text" in message.result) {
      console.log("R: ", message.result.text);
    }
  });

  recognizer.on("partialresult", (message) => {
    if ("result" in message && "partial" in message.result) {
      console.log("P: ", message.result.partial);
    }
  });

  recognizer.on("error", (message) => {
    console.error("Err:", message);
  });
}

export async function exit() {
  console.log("EXIT");
  audioResources = exitAudioResources(audioResources);
  exitRecognizerModel(recognizer);
}
