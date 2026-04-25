export const AUDIO_OUTPUT_EVENT_CAPTURE = 'capture' as const;
export const AUDIO_OUTPUT_EVENT_CHECK = 'check' as const;
export const AUDIO_OUTPUT_EVENT_CASTLE = 'castle' as const;
export const AUDIO_OUTPUT_EVENT_PROMOTION = 'promotion' as const;
export const AUDIO_OUTPUT_EVENT_END_CHECKMATE = 'checkmate' as const;
export const AUDIO_OUTPUT_EVENT_END_OTHER = 'end' as const;
export const AUDIO_OUTPUT_EVENT_MOVE_TOP = 'move-top' as const;
export const AUDIO_OUTPUT_EVENT_MOVE_BOTTOM = 'move-bottom' as const;
export const AUDIO_OUTPUT_EVENT_INVALID = 'invalid' as const;

export type AudioOutputEvent =
  | typeof AUDIO_OUTPUT_EVENT_CAPTURE
  | typeof AUDIO_OUTPUT_EVENT_CHECK
  | typeof AUDIO_OUTPUT_EVENT_CASTLE
  | typeof AUDIO_OUTPUT_EVENT_PROMOTION
  | typeof AUDIO_OUTPUT_EVENT_END_CHECKMATE
  | typeof AUDIO_OUTPUT_EVENT_END_OTHER
  | typeof AUDIO_OUTPUT_EVENT_MOVE_TOP
  | typeof AUDIO_OUTPUT_EVENT_MOVE_BOTTOM
  | typeof AUDIO_OUTPUT_EVENT_INVALID;
