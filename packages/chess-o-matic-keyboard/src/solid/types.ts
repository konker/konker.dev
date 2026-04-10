import type { KeyboardBehaviorSettings } from '../core/types.js';

export type ChessKeyboardVisibleSettingsMap = Partial<Record<keyof KeyboardBehaviorSettings, boolean>>;
export type ChessKeyboardVisibleSettings = false | ChessKeyboardVisibleSettingsMap;
