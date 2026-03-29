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

// --------------------------------------------------------------------------
export type AudioOutputResources = {
  readonly audioOutputEventSoundMap: AudioOutputEventSoundMap;
};

// --------------------------------------------------------------------------
export async function initAudioOutput(): Promise<AudioOutputResources> {
  return {
    audioOutputEventSoundMap: standardAudioOutputEventSoundMap,
  };
}

// --------------------------------------------------------------------------
export async function exitAudioOutput(_audioOutputResources: AudioOutputResources): Promise<void> {
  return;
}

// --------------------------------------------------------------------------
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

// --------------------------------------------------------------------------
export async function playAudioOutputEventSound(
  settings: ComSettings,
  AudioOutputResources: AudioOutputResources,
  event: AudioOutputEvent
): Promise<void> {
  if (settings.audioOutputOn) {
    const audio = AudioOutputResources.audioOutputEventSoundMap[event];
    if (audio) {
      audio.currentTime = 0;
      await audio.play();
    }
  }
}

// --------------------------------------------------------------------------
export async function boardAdapterUpdateMovedSoundsOk(
  settings: ComSettings,
  audioOutputResources: AudioOutputResources,
  flags: GameMoveFlags
): Promise<void> {
  const soundEvent = resolveAudioOutputSoundEvent(flags);
  await playAudioOutputEventSound(settings, audioOutputResources, soundEvent);
}

// --------------------------------------------------------------------------
export async function boardAdapterUpdateMovedSoundsInvalid(
  settings: ComSettings,
  audioOutputResources: AudioOutputResources,
  _evaluateResult: GameModelEvaluateResultIgnore | GameModelEvaluateResultIllegal
): Promise<void> {
  await playAudioOutputEventSound(settings, audioOutputResources, AUDIO_OUTPUT_EVENT_INVALID);
}

// --------------------------------------------------------------------------
export async function boardAdapterUpdateControlSounds(
  _settings: ComSettings,
  _audioOutputResources: AudioOutputResources,
  _evaluateResult: GameModelEvaluateResultControl
): Promise<void> {
  return;
}
