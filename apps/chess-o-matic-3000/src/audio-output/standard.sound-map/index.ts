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
} from '../events';
import type { AudioOutputEventSoundMap } from '../sound-map';
import captureSound from './sounds/capture.mp3';
import castleSound from './sounds/castle.mp3';
import endCheckmateSound from './sounds/checkmate.mp3';
import endOtherSound from './sounds/game-draw.mp3';
import invalidSound from './sounds/illegal.mp3';
import checkSound from './sounds/move-check.mp3';
import moveTopSound from './sounds/move-opponent.mp3';
import moveBottomSound from './sounds/move-self.mp3';
import promotionSound from './sounds/promote.mp3';

function createAudioElement(src: string): HTMLAudioElement {
  const audio = new Audio(src);
  audio.preload = 'auto';
  return audio;
}

export const standardAudioOutputEventSoundMap: AudioOutputEventSoundMap = {
  [AUDIO_OUTPUT_EVENT_CAPTURE]: createAudioElement(captureSound),
  [AUDIO_OUTPUT_EVENT_CHECK]: createAudioElement(checkSound),
  [AUDIO_OUTPUT_EVENT_CASTLE]: createAudioElement(castleSound),
  [AUDIO_OUTPUT_EVENT_PROMOTION]: createAudioElement(promotionSound),
  [AUDIO_OUTPUT_EVENT_END_CHECKMATE]: createAudioElement(endCheckmateSound),
  [AUDIO_OUTPUT_EVENT_END_OTHER]: createAudioElement(endOtherSound),
  [AUDIO_OUTPUT_EVENT_MOVE_TOP]: createAudioElement(moveTopSound),
  [AUDIO_OUTPUT_EVENT_MOVE_BOTTOM]: createAudioElement(moveBottomSound),
  [AUDIO_OUTPUT_EVENT_INVALID]: createAudioElement(invalidSound),
};
