import type { GameMoveFlags } from '../application/types/game-move-flags';
import type {
  GameModelEvaluateResultControl,
  GameModelEvaluateResultIgnore,
  GameModelEvaluateResultIllegal,
} from '../game-model/evaluate';
import type { ComSettings } from '../settings';
import type { AudioOutputEvent } from './events';
import {
  AUDIO_OUTPUT_EVENT_CAPTURE,
  AUDIO_OUTPUT_EVENT_CASTLE,
  AUDIO_OUTPUT_EVENT_CHECK,
  AUDIO_OUTPUT_EVENT_END_CHECKMATE,
  AUDIO_OUTPUT_EVENT_END_OTHER,
  AUDIO_OUTPUT_EVENT_INVALID,
  AUDIO_OUTPUT_EVENT_MOVE_BOTTOM,
  AUDIO_OUTPUT_EVENT_MOVE_TOP,
  AUDIO_OUTPUT_EVENT_PROMOTION,
} from './events';
import type { AudioOutputEventSoundMap } from './sound-map';
import { standardAudioOutputEventSoundMap } from './standard.sound-map';

type AudioContextLike = AudioContext;
type AudioContextCtor = new () => AudioContextLike;

export type AudioOutputResources = {
  audioBufferMap: Partial<Record<AudioOutputEvent, AudioBuffer>>;
  audioContext: AudioContextLike;
  audioOutputEventSoundMap: AudioOutputEventSoundMap;
  isUnlocked: boolean;
};

function resolveAudioContextCtor(): AudioContextCtor | undefined {
  const scope = globalThis as typeof globalThis & {
    webkitAudioContext?: AudioContextCtor;
  };

  return scope.AudioContext ?? scope.webkitAudioContext;
}

async function decodeAudioBuffer(audioContext: AudioContextLike, src: string): Promise<AudioBuffer> {
  const response = await fetch(src);

  if (!response.ok) {
    throw new Error(`Failed to load audio asset: ${src}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

async function ensureAudioContextReady(audioOutputResources: AudioOutputResources): Promise<void> {
  if (audioOutputResources.audioContext.state === 'suspended') {
    await audioOutputResources.audioContext.resume();
  }
}

function createSilentBuffer(audioContext: AudioContextLike): AudioBuffer {
  return audioContext.createBuffer(1, 1, audioContext.sampleRate);
}

function playAudioBuffer(
  audioContext: AudioContextLike,
  audioBuffer: AudioBuffer,
  destination: AudioNode = audioContext.destination
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(destination);
  source.start(0);
  return source;
}

export function audioOutputIsSupported(): boolean {
  return typeof fetch === 'function' && typeof resolveAudioContextCtor() !== 'undefined';
}

export async function initAudioOutput(): Promise<AudioOutputResources> {
  const AudioContextCtor = resolveAudioContextCtor();

  if (!AudioContextCtor) {
    throw new Error('Audio output is not supported in this browser.');
  }

  const audioContext = new AudioContextCtor();
  const audioOutputEventSoundMap = standardAudioOutputEventSoundMap;
  const audioBufferEntries = await Promise.all(
    Object.entries(audioOutputEventSoundMap).map(async ([event, src]) => {
      const audioBuffer = await decodeAudioBuffer(audioContext, src);
      return [event, audioBuffer] as const;
    })
  );

  return {
    audioBufferMap: Object.fromEntries(audioBufferEntries) as Partial<Record<AudioOutputEvent, AudioBuffer>>,
    audioContext,
    audioOutputEventSoundMap,
    isUnlocked: false,
  };
}

export async function exitAudioOutput(audioOutputResources: AudioOutputResources): Promise<void> {
  if (audioOutputResources.audioContext.state !== 'closed') {
    await audioOutputResources.audioContext.close();
  }
}

export async function unlockAudioOutput(audioOutputResources: AudioOutputResources): Promise<void> {
  await ensureAudioContextReady(audioOutputResources);

  const silentBuffer = createSilentBuffer(audioOutputResources.audioContext);
  const source = playAudioBuffer(audioOutputResources.audioContext, silentBuffer);
  source.stop();
  audioOutputResources.isUnlocked = true;
}

export function resolveAudioOutputSoundEvent(gameMoveFlags: GameMoveFlags): AudioOutputEvent {
  if (gameMoveFlags.isCheckmate) {
    return AUDIO_OUTPUT_EVENT_END_CHECKMATE;
  }
  if (gameMoveFlags.isCheck) {
    return AUDIO_OUTPUT_EVENT_CHECK;
  }
  if (gameMoveFlags.isCapture) {
    return AUDIO_OUTPUT_EVENT_CAPTURE;
  }
  if (gameMoveFlags.isCastle) {
    return AUDIO_OUTPUT_EVENT_CASTLE;
  }
  if (gameMoveFlags.isPromotion) {
    return AUDIO_OUTPUT_EVENT_PROMOTION;
  }
  if (gameMoveFlags.isEnd) {
    return AUDIO_OUTPUT_EVENT_END_OTHER;
  }
  if (gameMoveFlags.isBottomMove) {
    return AUDIO_OUTPUT_EVENT_MOVE_BOTTOM;
  }
  return AUDIO_OUTPUT_EVENT_MOVE_TOP;
}

export async function playAudioOutputEventSound(
  settings: ComSettings,
  audioOutputResources: AudioOutputResources,
  event: AudioOutputEvent
): Promise<void> {
  if (!settings.audioOutputOn) {
    return;
  }

  await ensureAudioContextReady(audioOutputResources);
  const audioBuffer = audioOutputResources.audioBufferMap[event];

  if (!audioBuffer) {
    throw new Error(`Missing audio buffer for event: ${event}`);
  }

  playAudioBuffer(audioOutputResources.audioContext, audioBuffer);
}

export async function boardAdapterUpdateMovedSoundsOk(
  settings: ComSettings,
  audioOutputResources: AudioOutputResources,
  flags: GameMoveFlags
): Promise<void> {
  const soundEvent = resolveAudioOutputSoundEvent(flags);
  await playAudioOutputEventSound(settings, audioOutputResources, soundEvent);
}

export async function boardAdapterUpdateMovedSoundsInvalid(
  settings: ComSettings,
  audioOutputResources: AudioOutputResources,
  _evaluateResult: GameModelEvaluateResultIgnore | GameModelEvaluateResultIllegal
): Promise<void> {
  await playAudioOutputEventSound(settings, audioOutputResources, AUDIO_OUTPUT_EVENT_INVALID);
}

export async function boardAdapterUpdateControlSounds(
  _settings: ComSettings,
  _audioOutputResources: AudioOutputResources,
  _evaluateResult: GameModelEvaluateResultControl
): Promise<void> {
  return;
}
