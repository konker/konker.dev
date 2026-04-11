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

export const standardAudioOutputEventSoundMap: AudioOutputEventSoundMap = {
  [AUDIO_OUTPUT_EVENT_CAPTURE]: captureSound,
  [AUDIO_OUTPUT_EVENT_CHECK]: checkSound,
  [AUDIO_OUTPUT_EVENT_CASTLE]: castleSound,
  [AUDIO_OUTPUT_EVENT_PROMOTION]: promotionSound,
  [AUDIO_OUTPUT_EVENT_END_CHECKMATE]: endCheckmateSound,
  [AUDIO_OUTPUT_EVENT_END_OTHER]: endOtherSound,
  [AUDIO_OUTPUT_EVENT_MOVE_TOP]: moveTopSound,
  [AUDIO_OUTPUT_EVENT_MOVE_BOTTOM]: moveBottomSound,
  [AUDIO_OUTPUT_EVENT_INVALID]: invalidSound,
};
