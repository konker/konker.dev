/* eslint-disable fp/no-this */

// AudioWorklet processor for capturing microphone input
class AudioInputCaptureWorklet extends AudioWorkletProcessor {
  private static readonly AUDIO_MESSAGE_TYPE = 'audio';

  process(
    inputs: Array<Array<Float32Array>>,
    _outputs: Array<Array<Float32Array>>,
    _parameters: Record<string, Float32Array>
  ): boolean {
    const firstInput = inputs[0];
    const firstChannel = firstInput?.[0];

    if (!firstChannel) {
      return true;
    }

    this.postAudioMessage(firstChannel);
    return true;
  }

  private postAudioMessage(audioData: Float32Array): void {
    this.port.postMessage({
      type: AudioInputCaptureWorklet.AUDIO_MESSAGE_TYPE,
      data: audioData,
    });
  }
}

registerProcessor('audio-input-capture', AudioInputCaptureWorklet);
