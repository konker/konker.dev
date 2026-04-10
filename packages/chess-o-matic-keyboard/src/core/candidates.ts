/* eslint-disable fp/no-nil */
import { getLegalMovesSan } from './context.js';
import type {
  KeyboardBehaviorSettings,
  KeyboardContext,
  KeyboardKeyDefinition,
  KeyboardKeyId,
  KeyboardLayer,
} from './types.js';
import { KEYBOARD_KEYS } from './types.js';

export type CandidateAnalysis = {
  readonly autoSubmitMatch?: string;
  readonly exactMatches: ReadonlyArray<string>;
  readonly highlightedKeyIds: ReadonlySet<KeyboardKeyId>;
  readonly legalMovesSan: ReadonlyArray<string>;
  readonly matchingMoves: ReadonlyArray<string>;
  readonly shouldAutoSubmit: boolean;
};

export function buildCandidateAnalysis(
  input: string,
  context: KeyboardContext | undefined,
  layer: KeyboardLayer,
  settings: KeyboardBehaviorSettings
): CandidateAnalysis {
  const legalMovesSan = getLegalMovesSan(context);
  const matchingMoves = input.length === 0 ? [] : legalMovesSan.filter((move) => move.startsWith(input));
  const exactMatches = input.length === 0 ? [] : legalMovesSan.filter((move) => move === input);
  const shouldAutoSubmit = settings.autoSubmit && exactMatches.length === 1;
  const autoSubmitMatch = shouldAutoSubmit ? exactMatches[0] : undefined;

  return {
    ...(autoSubmitMatch === undefined ? {} : { autoSubmitMatch }),
    exactMatches,
    highlightedKeyIds: deriveHighlightedKeyIds(input, legalMovesSan, layer, settings),
    legalMovesSan,
    matchingMoves,
    shouldAutoSubmit,
  };
}

export function deriveHighlightedKeyIds(
  input: string,
  legalMovesSan: ReadonlyArray<string>,
  layer: KeyboardLayer,
  settings: KeyboardBehaviorSettings
): ReadonlySet<KeyboardKeyId> {
  if (
    settings.keyHighlightsMode === 'off' ||
    legalMovesSan.length === 0 ||
    (settings.keyHighlightsMode === 'after-input' && input.length === 0)
  ) {
    return new Set<KeyboardKeyId>();
  }

  return new Set(
    getVisibleNotationKeys(layer)
      .filter((key) => legalMovesSan.some((move) => move.startsWith(`${input}${key.value}`)))
      .map((key) => key.id)
  );
}

function getVisibleNotationKeys(layer: KeyboardLayer): ReadonlyArray<KeyboardKeyDefinition> {
  const visibleLayers = layer === 'secondary' ? ['primary', 'secondary'] : [layer];

  return KEYBOARD_KEYS.filter(
    (key) => key.kind === 'notation' && key.layers.some((candidateLayer) => visibleLayers.includes(candidateLayer))
  );
}
