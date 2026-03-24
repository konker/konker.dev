import type { ComSettings } from '../../settings';
import type { AudioOutputEvent } from './events';
import type { AudioOutputEventSoundMap } from './sound-map';
import { standardAudioOutputEventSoundMap } from './standard.sound-map';

// --------------------------------------------------------------------------
export type AudioOutputResources = {
  readonly audioOutputEventSoundMap: AudioOutputEventSoundMap;
};

// --------------------------------------------------------------------------
export async function initAudioOutputResources(): Promise<AudioOutputResources> {
  return {
    audioOutputEventSoundMap: standardAudioOutputEventSoundMap,
  };
}

// --------------------------------------------------------------------------
export async function playAudioOutputEventSound(
  settings: ComSettings,
  AudioOutputResources: AudioOutputResources,
  event: AudioOutputEvent
): Promise<void> {
  if (settings.soundsOn) {
    const audio = AudioOutputResources.audioOutputEventSoundMap[event];
    console.log('KONK81', event, audio);
    if (audio) {
      audio.currentTime = 0;
      await audio.play();
    }
  }
}

// --------------------------------------------------------------------------
export function exitAudioOutputResources(audioOutputResources: AudioOutputResources): AudioOutputResources {
  return audioOutputResources;
}
