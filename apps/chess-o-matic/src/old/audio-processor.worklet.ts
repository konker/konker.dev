// audio-processor.worklet.ts
// AudioWorklet processor for capturing microphone input

/// <reference path="./audio-worklet.d.ts" />

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class AudioCaptureProcessor extends AudioWorkletProcessor {
  process(
    inputs: Float32Array[][],
    _outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0];

    if (input && input.length > 0) {
      const channelData = input[0];

      // Send audio data to main thread
      this.port.postMessage({
        type: 'audio',
        data: channelData,
      });
    }

    // Return true to keep the processor alive
    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
