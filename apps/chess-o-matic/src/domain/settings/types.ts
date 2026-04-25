export type AppSettings = {
  readonly audioInputEnabled: boolean;
  readonly audioOutputEnabled: boolean;
};

export const APP_SETTINGS_DEFAULT: AppSettings = {
  audioInputEnabled: false,
  audioOutputEnabled: false,
} as const;
