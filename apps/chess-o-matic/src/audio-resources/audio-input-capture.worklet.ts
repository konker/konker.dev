// AudioWorklet processor for capturing microphone input

class AudioInputCaptureWorklet extends AudioWorkletProcessor {
  process(
    inputs: Float32Array[][],
    _outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0];

    if (input && input.length > 0) {
      const channelData = input[0];

      // Send audio data to the main thread
      this.port.postMessage({
        type: 'audio',
        data: channelData,
      });
    }

    // Return true to keep the processor alive
    return true;
  }
}

registerProcessor('audio-input-capture', AudioInputCaptureWorklet);
