import type { KeyboardBehaviorSettings } from '../core/types.js';

export type ChessKeyboardVisibleSettings = Partial<Record<keyof KeyboardBehaviorSettings, boolean>>;
