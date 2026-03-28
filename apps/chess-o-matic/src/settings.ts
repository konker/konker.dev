// --------------------------------------------------------------------------
export class ComSettings {
  constructor(
    public audioOutputOn = true,
    public audioInputOn = true
  ) {}
}

export async function initComSettings(settings: Partial<ComSettings> = {}): Promise<ComSettings> {
  return new ComSettings(settings.audioOutputOn ?? true, settings.audioInputOn ?? true);
}
