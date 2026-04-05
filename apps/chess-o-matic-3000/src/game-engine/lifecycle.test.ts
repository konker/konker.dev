import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GameStorage } from '../application/ports/GameStorage';
import { createDefaultAppState, EMPTY_PERSISTED_SAVED_GAME_INDEX } from '../domain/game/types';

const {
  boardAdapterUpdateMovedSoundsInvalidMock,
  boardAdapterUpdateMovedSoundsOkMock,
  exitAudioInputMock,
  exitSpeechRecognizerMock,
  initAudioInputMock,
  initSpeechRecognizerMock,
  startAudioInputMock,
  startSpeechRecognizerMock,
  stopAudioInputMock,
  stopSpeechRecognizerMock,
  unlockAudioOutputMock,
} = vi.hoisted(() => ({
  boardAdapterUpdateMovedSoundsInvalidMock: vi.fn(),
  boardAdapterUpdateMovedSoundsOkMock: vi.fn(),
  exitAudioInputMock: vi.fn(),
  exitSpeechRecognizerMock: vi.fn(),
  initAudioInputMock: vi.fn(),
  unlockAudioOutputMock: vi.fn(),
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
  boardAdapterUpdateMovedSoundsInvalid: boardAdapterUpdateMovedSoundsInvalidMock,
  boardAdapterUpdateMovedSoundsOk: boardAdapterUpdateMovedSoundsOkMock,
  exitAudioOutput: vi.fn(),
  initAudioOutput: vi.fn(async () => ({
    audioOutputEventSoundMap: {} as Record<string, HTMLAudioElement>,
  })),
  unlockAudioOutput: unlockAudioOutputMock,
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
    boardAdapterUpdateMovedSoundsInvalidMock.mockReset();
    boardAdapterUpdateMovedSoundsOkMock.mockReset();
    initSpeechRecognizerMock.mockReset();
    unlockAudioOutputMock.mockReset();
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
    unlockAudioOutputMock.mockResolvedValue(undefined);
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

  it('plays the invalid move sound when a board move is illegal', async () => {
    const gameEngine = createGameEngine({ gameStorage: createMemoryGameStorage() });

    await gameEngine.init({});
    await gameEngine.handleBoardMove('e5');

    expect(boardAdapterUpdateMovedSoundsInvalidMock).toHaveBeenCalledTimes(1);
    expect(boardAdapterUpdateMovedSoundsOkMock).not.toHaveBeenCalled();
  });

  it('keeps emitting evaluated UI state when move audio playback fails', async () => {
    const onUiStateChange = vi.fn();
    const gameEngine = createGameEngine({ gameStorage: createMemoryGameStorage() });
    boardAdapterUpdateMovedSoundsOkMock.mockRejectedValueOnce(new Error('Audio play() rejected'));

    await gameEngine.init({ onUiStateChange });
    await gameEngine.handleBoardMove('e4');

    expect(boardAdapterUpdateMovedSoundsOkMock).toHaveBeenCalledTimes(1);
    expect(onUiStateChange.mock.calls.at(-1)?.[0]).toMatchObject({
      currentPly: 1,
      lastInputEvaluateStatus: 'ok',
      lastInputResultMessage: 'e4',
      lastMoveSan: 'e4',
      pgn: expect.stringContaining('1. e4'),
      scoresheetData: [['e4', '*']],
    });
  });

  it('unlocks audio output when sounds are enabled', async () => {
    const gameEngine = createGameEngine({ gameStorage: createMemoryGameStorage() });

    await gameEngine.init({});
    await gameEngine.audioOutputToggle();
    await gameEngine.audioOutputToggle();

    expect(unlockAudioOutputMock).toHaveBeenCalledTimes(1);
  });

  it('sets game result to 0-1 when White resigns via speech recognition', async () => {
    const onUiStateChange = vi.fn();

    // Override startSpeechRecognizerMock for this test to capture the recognizer callbacks
    const recognizerOnMock = vi.fn();
    startSpeechRecognizerMock.mockResolvedValueOnce({
      model: {},
      modelUrl: '/models/vosk-model-small-en-us-0.15.zip',
      recognizer: {
        acceptWaveformFloat: vi.fn(),
        on: recognizerOnMock,
      },
      status: 'active',
    });

    const gameEngine = createGameEngine({ gameStorage: createMemoryGameStorage() });

    await gameEngine.init({ onUiStateChange });
    await gameEngine.attachBoardController({ renderPosition: () => undefined });

    // Toggle audio input on — registers 'result' and 'error' callbacks on the recognizer
    await gameEngine.audioInputToggle();

    const resultCallArgs = recognizerOnMock.mock.calls.find(([event]) => event === 'result');
    const resultCallback = resultCallArgs?.[1] as ((msg: unknown) => Promise<void>) | undefined;
    if (!resultCallback) throw new Error('Expected result callback to be registered');

    // Simulate a 'resign' speech recognition result (White to move at start → result is '0-1')
    await resultCallback({ result: { text: 'resign' } });

    const lastUiState = onUiStateChange.mock.calls.at(-1)?.[0];
    expect(lastUiState?.lastInputEvaluateStatus).toBe('control');
    expect(lastUiState?.lastInputResultMessage).toBe('Game resigned');
    expect(lastUiState?.gameMetadata?.result).toBe('0-1');
  });
});
