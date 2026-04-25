export type SpeechInputStartOptions = {
  readonly onError?: (error: Error) => void;
  readonly onResult: (result: string) => Promise<void> | void;
};

export type SpeechInput = {
  readonly dispose: () => Promise<void>;
  readonly isSupported: () => boolean;
  readonly start: (options: SpeechInputStartOptions) => Promise<void>;
  readonly stop: () => Promise<void>;
};
