import type { GameMoveFlags } from '../../game-model/evaluate';
import type { ComSettings } from '../../settings';
import type { AudioOutputEvent } from './events';
import { AUDIO_OUTPUT_EVENT_MOVE_TOP } from './events';
import { AUDIO_OUTPUT_EVENT_END_OTHER } from './events';
import { AUDIO_OUTPUT_EVENT_PROMOTION } from './events';
import { AUDIO_OUTPUT_EVENT_CAPTURE } from './events';
import { AUDIO_OUTPUT_EVENT_CASTLE } from './events';
import { AUDIO_OUTPUT_EVENT_CHECK } from './events';
import { AUDIO_OUTPUT_EVENT_END_CHECKMATE } from './events';
import { AUDIO_OUTPUT_EVENT_MOVE_BOTTOM } from './events';
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
export function resolveAudioOutputSoundEvent(_gameMoveFlags: GameMoveFlags): AudioOutputEvent {
  if (_gameMoveFlags.isCheckmate) {
    return AUDIO_OUTPUT_EVENT_END_CHECKMATE;
  }
  if (_gameMoveFlags.isCheck) {
    return AUDIO_OUTPUT_EVENT_CHECK;
  }
  if (_gameMoveFlags.isCapture) {
    return AUDIO_OUTPUT_EVENT_CAPTURE;
  }
  if (_gameMoveFlags.isCastle) {
    return AUDIO_OUTPUT_EVENT_CASTLE;
  }
  if (_gameMoveFlags.isPromotion) {
    return AUDIO_OUTPUT_EVENT_PROMOTION;
  }
  if (_gameMoveFlags.isEnd) {
    return AUDIO_OUTPUT_EVENT_END_OTHER;
  }
  if (_gameMoveFlags.isBottomMove) {
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
