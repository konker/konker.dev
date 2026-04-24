import type { KeyboardBehaviorSettings } from '../core/types.js';

export function areSettingsEqual(left: KeyboardBehaviorSettings, right: KeyboardBehaviorSettings): boolean {
  return (
    left.allowOmittedXInPieceCaptures === right.allowOmittedXInPieceCaptures &&
    left.autoSubmit === right.autoSubmit &&
    left.autoSubmitOnSinglePartialMatch === right.autoSubmitOnSinglePartialMatch &&
    left.candidateBar === right.candidateBar &&
    left.keyHighlightsMode === right.keyHighlightsMode &&
    left.perspective === right.perspective &&
    left.showReadout === right.showReadout
  );
}

export function areStringListsEqual(
  left: ReadonlyArray<string> | undefined,
  right: ReadonlyArray<string> | undefined
): boolean {
  if (left === right) {
    return true;
  }

  if (left === undefined || left.length !== right?.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}
