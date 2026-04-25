declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  readonly parameters: Record<string, Float32Array>;

  abstract process(
    inputs: Array<Array<Float32Array>>,
    outputs: Array<Array<Float32Array>>,
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare function registerProcessor(name: string, processorCtor: new () => AudioWorkletProcessor): void;
