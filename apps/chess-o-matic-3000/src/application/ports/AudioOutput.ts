export type AudioOutputEventName =
  | 'capture'
  | 'castle'
  | 'check'
  | 'checkmate'
  | 'end'
  | 'invalid'
  | 'move-bottom'
  | 'move-top'
  | 'promotion';

export type AudioOutput = {
  readonly dispose: () => Promise<void>;
  readonly isSupported: () => boolean;
  readonly play: (eventName: AudioOutputEventName) => Promise<void>;
};
