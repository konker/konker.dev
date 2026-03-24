import {
  AUDIO_OUTPUT_EVENT_CAPTURE,
  AUDIO_OUTPUT_EVENT_INVALID,
  AUDIO_OUTPUT_EVENT_MOVE_BOTTOM,
  AUDIO_OUTPUT_EVENT_MOVE_TOP,
} from '../events';
import type { AudioOutputEventSoundMap } from '../sound-map';
import captureSound from './sounds/capture.mp3';
import invalidSound from './sounds/illegal.mp3';
import moveTopSound from './sounds/move-opponent.mp3';
import moveBottomSound from './sounds/move-self.mp3';

export const standardAudioOutputEventSoundMap: AudioOutputEventSoundMap = {
  [AUDIO_OUTPUT_EVENT_CAPTURE]: new Audio(captureSound),
  [AUDIO_OUTPUT_EVENT_MOVE_TOP]: new Audio(moveTopSound),
  [AUDIO_OUTPUT_EVENT_MOVE_BOTTOM]: new Audio(moveBottomSound),
  [AUDIO_OUTPUT_EVENT_INVALID]: new Audio(invalidSound),
};
