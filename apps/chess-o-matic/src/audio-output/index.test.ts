import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUDIO_OUTPUT_EVENT_INVALID, AUDIO_OUTPUT_EVENT_MOVE_TOP } from './events';

const { standardAudioOutputEventSoundMapMock } = vi.hoisted(() => ({
  standardAudioOutputEventSoundMapMock: {
    capture: '/capture.mp3',
    castle: '/castle.mp3',
    check: '/check.mp3',
    checkmate: '/checkmate.mp3',
    end: '/end.mp3',
    invalid: '/invalid.mp3',
    'move-bottom': '/move-bottom.mp3',
    'move-top': '/move-top.mp3',
    promotion: '/promotion.mp3',
  } as const,
}));

vi.mock('./standard.sound-map', () => ({
  standardAudioOutputEventSoundMap: standardAudioOutputEventSoundMapMock,
}));

import { type AudioOutputResources, initAudioOutput, playAudioOutputEventSound, unlockAudioOutput } from './index';

type FakeSourceNode = {
  buffer: unknown;
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

class FakeAudioContext {
  createBuffer = vi.fn((_channels: number, _length: number, _sampleRate: number) => ({ id: 'silent-buffer' }));
  createBufferSource = vi.fn(() => {
    const source: FakeSourceNode = {
      buffer: undefined,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    return source;
  });
  close = vi.fn(async () => undefined);
  decodeAudioData = vi.fn(async (buffer: ArrayBuffer) => ({ byteLength: buffer.byteLength }));
  destination = { id: 'destination' } as unknown as AudioDestinationNode;
  resume = vi.fn(async () => {
    // eslint-disable-next-line fp/no-this
    this.state = 'running';
  });
  sampleRate = 44_100;
  state: AudioContextState = 'suspended';
}

describe('audio-output', () => {
  beforeEach(() => {
    const fetchMock = vi.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(8),
      ok: true,
    }));

    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  it('decodes the standard sound map into audio buffers', async () => {
    const audioOutputResources = await initAudioOutput();

    expect(fetch).toHaveBeenCalledTimes(Object.keys(standardAudioOutputEventSoundMapMock).length);
    expect(audioOutputResources.audioBufferMap[AUDIO_OUTPUT_EVENT_MOVE_TOP]).toEqual({ byteLength: 8 });
    expect(audioOutputResources.audioBufferMap[AUDIO_OUTPUT_EVENT_INVALID]).toEqual({ byteLength: 8 });
    expect(audioOutputResources.isUnlocked).toBe(false);
  });

  it('unlocks audio output by resuming the context and priming a silent buffer', async () => {
    const audioOutputResources = await initAudioOutput();

    await unlockAudioOutput(audioOutputResources);

    expect(audioOutputResources.audioContext.resume).toHaveBeenCalledTimes(1);
    expect(audioOutputResources.audioContext.createBuffer).toHaveBeenCalledTimes(1);
    expect(audioOutputResources.audioContext.createBufferSource).toHaveBeenCalledTimes(1);
    const createBufferSourceMock = audioOutputResources.audioContext.createBufferSource as unknown as ReturnType<
      typeof vi.fn
    >;
    const source = createBufferSourceMock.mock.results[0]?.value as FakeSourceNode;
    expect(source.start).toHaveBeenCalledWith(0);
    expect(source.stop).toHaveBeenCalledTimes(1);
    expect(audioOutputResources.isUnlocked).toBe(true);
  });

  it('plays decoded buffers through the shared audio context', async () => {
    const audioOutputResources = (await initAudioOutput()) as AudioOutputResources & {
      audioContext: FakeAudioContext;
    };

    await playAudioOutputEventSound(
      {
        audioInputOn: false,
        audioOutputOn: true,
      },
      audioOutputResources,
      AUDIO_OUTPUT_EVENT_MOVE_TOP
    );

    expect(audioOutputResources.audioContext.resume).toHaveBeenCalledTimes(1);
    expect(audioOutputResources.audioContext.createBufferSource).toHaveBeenCalledTimes(1);
    const createBufferSourceMock = audioOutputResources.audioContext.createBufferSource as unknown as ReturnType<
      typeof vi.fn
    >;
    const source = createBufferSourceMock.mock.results[0]?.value as FakeSourceNode;
    expect(source.buffer).toEqual({ byteLength: 8 });
    expect(source.connect).toHaveBeenCalledWith(audioOutputResources.audioContext.destination);
    expect(source.start).toHaveBeenCalledWith(0);
  });
});
