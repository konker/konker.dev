import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameStorage } from '../application/ports/GameStorage';
import { createDefaultAppState, EMPTY_PERSISTED_SAVED_GAME_INDEX } from '../domain/game/types';

const {
  exitAudioInputMock,
  exitSpeechRecognizerMock,
  initAudioInputMock,
  initSpeechRecognizerMock,
  startAudioInputMock,
  startSpeechRecognizerMock,
  stopAudioInputMock,
  stopSpeechRecognizerMock,
} = vi.hoisted(() => ({
  exitAudioInputMock: vi.fn(),
  exitSpeechRecognizerMock: vi.fn(),
  initAudioInputMock: vi.fn(),
  initSpeechRecognizerMock: vi.fn(),
  startAudioInputMock: vi.fn(),
  startSpeechRecognizerMock: vi.fn(),
  stopAudioInputMock: vi.fn(),
  stopSpeechRecognizerMock: vi.fn(),
}));

vi.mock('../audio-input', () => ({
  AUDIO_INPUT_LISTENING_OFF: 'not-listening',
  AUDIO_INPUT_LISTENING_ON: 'listening',
  audioInputIsSupported: () => true,
  exitAudioInput: exitAudioInputMock,
  initAudioInput: initAudioInputMock,
  startAudioInput: startAudioInputMock,
  stopAudioInput: stopAudioInputMock,
}));

vi.mock('../audio-output', () => ({
  audioOutputIsSupported: () => true,
  boardAdapterUpdateMovedSoundsOk: vi.fn(),
  exitAudioOutput: vi.fn(),
  initAudioOutput: vi.fn(async () => ({
    audioOutputEventSoundMap: {} as Record<string, HTMLAudioElement>,
  })),
}));

vi.mock('../speech-recognizer', () => ({
  exitSpeechRecognizer: exitSpeechRecognizerMock,
  initSpeechRecognizer: initSpeechRecognizerMock,
  startSpeechRecognizer: startSpeechRecognizerMock,
  stopSpeechRecognizer: stopSpeechRecognizerMock,
}));

import { createGameEngine } from './index';

function createMemoryGameStorage(): GameStorage {
  let appState = createDefaultAppState('2026-03-30T00:00:00.000Z');

  return {
    async deleteGame() {
      return;
    },
    async loadAppState() {
      return appState;
    },
    async loadGame() {
      return undefined;
    },
    async loadSavedGameIndex() {
      return EMPTY_PERSISTED_SAVED_GAME_INDEX;
    },
    async saveAppState(nextAppState) {
      appState = nextAppState;
    },
    async saveGame() {
      return;
    },
  };
}

describe('game engine lifecycle', () => {
  beforeEach(() => {
    initAudioInputMock.mockReset();
    startAudioInputMock.mockReset();
    stopAudioInputMock.mockReset();
    exitAudioInputMock.mockReset();
    initSpeechRecognizerMock.mockReset();
    startSpeechRecognizerMock.mockReset();
    stopSpeechRecognizerMock.mockReset();
    exitSpeechRecognizerMock.mockReset();

    initAudioInputMock.mockResolvedValue({
      audioContext: null,
      mediaStream: null,
      status: 'not-listening',
      workletNode: null,
    });

    startAudioInputMock.mockImplementation(async () => ({
      audioContext: { sampleRate: 16_000 },
      mediaStream: null,
      status: 'listening',
      workletNode: {
        port: {
          onmessage: null,
        },
      },
    }));

    stopAudioInputMock.mockResolvedValue({
      audioContext: null,
      mediaStream: null,
      status: 'not-listening',
      workletNode: null,
    });

    exitAudioInputMock.mockResolvedValue(undefined);

    initSpeechRecognizerMock.mockResolvedValue({
      model: {},
      modelUrl: '/models/vosk-model-small-en-us-0.15.zip',
      status: 'inactive',
    });

    startSpeechRecognizerMock.mockResolvedValue({
      model: {},
      modelUrl: '/models/vosk-model-small-en-us-0.15.zip',
      recognizer: {
        on: vi.fn(),
      },
      status: 'active',
    });

    stopSpeechRecognizerMock.mockResolvedValue({
      model: {},
      modelUrl: '/models/vosk-model-small-en-us-0.15.zip',
      status: 'inactive',
    });

    exitSpeechRecognizerMock.mockResolvedValue(undefined);
  });

  it('reuses the loaded speech model across repeated toggles and disposes on exit', async () => {
    const gameEngine = createGameEngine({ gameStorage: createMemoryGameStorage() });

    await gameEngine.init({});
    await gameEngine.attachBoardController({
      renderPosition: () => undefined,
    });

    await gameEngine.audioInputToggle();
    await gameEngine.audioInputToggle();
    await gameEngine.audioInputToggle();
    await gameEngine.exit();

    expect(initSpeechRecognizerMock).toHaveBeenCalledTimes(1);
    expect(startSpeechRecognizerMock).toHaveBeenCalledTimes(2);
    expect(stopSpeechRecognizerMock).toHaveBeenCalledTimes(2);
    expect(startAudioInputMock).toHaveBeenCalledTimes(2);
    expect(stopAudioInputMock).toHaveBeenCalledTimes(2);
    expect(exitSpeechRecognizerMock).toHaveBeenCalledTimes(1);
  });
});
