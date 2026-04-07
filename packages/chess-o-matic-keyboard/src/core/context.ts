import type { KeyboardContext } from './types.js';

export function getLegalMovesSan(context?: KeyboardContext): ReadonlyArray<string> {
  return context?.legalMovesSan ?? [];
}
