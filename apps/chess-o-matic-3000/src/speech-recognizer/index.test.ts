import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createModelMock } = vi.hoisted(() => ({
  createModelMock: vi.fn(),
}));

vi.mock('vosk-browser', () => ({
  createModel: createModelMock,
}));

import { exitSpeechRecognizer, initSpeechRecognizer, startSpeechRecognizer, stopSpeechRecognizer } from './index';

describe('speech recognizer lifecycle', () => {
  beforeEach(() => {
    createModelMock.mockReset();
  });

  it('removes the active recognizer when stopping', async () => {
    const recognizerRemove = vi.fn();
    const modelTerminate = vi.fn();
    class FakeKaldiRecognizer {
      remove = recognizerRemove;
    }
    createModelMock.mockResolvedValue({
      KaldiRecognizer: FakeKaldiRecognizer,
      terminate: modelTerminate,
    });

    const inactive = await initSpeechRecognizer('/model.zip');
    const active = await startSpeechRecognizer(inactive, 16_000, ['e4']);
    const stopped = await stopSpeechRecognizer(active);

    expect(recognizerRemove).toHaveBeenCalledTimes(1);
    expect(stopped.status).toBe('inactive');
    expect(modelTerminate).not.toHaveBeenCalled();
  });

  it('terminates the model on exit even when already inactive', async () => {
    const modelTerminate = vi.fn();
    createModelMock.mockResolvedValue({
      KaldiRecognizer: vi.fn(),
      terminate: modelTerminate,
    });

    const inactive = await initSpeechRecognizer('/model.zip');
    await exitSpeechRecognizer(inactive);

    expect(modelTerminate).toHaveBeenCalledTimes(1);
  });
});
