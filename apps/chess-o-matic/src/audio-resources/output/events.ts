export const AUDIO_OUTPUT_EVENT_CAPTURE = 'capture' as const;
export const AUDIO_OUTPUT_EVENT_MOVE_TOP = 'move-top' as const;
export const AUDIO_OUTPUT_EVENT_MOVE_BOTTOM = 'move-bottom' as const;
export const AUDIO_OUTPUT_EVENT_INVALID = 'invalid' as const;

export type AudioOutputEvent =
  | typeof AUDIO_OUTPUT_EVENT_CAPTURE
  | typeof AUDIO_OUTPUT_EVENT_MOVE_TOP
  | typeof AUDIO_OUTPUT_EVENT_MOVE_BOTTOM
  | typeof AUDIO_OUTPUT_EVENT_INVALID;
