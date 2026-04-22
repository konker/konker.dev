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
  readonly autoSubmitTarget?: string;
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
  const legalMovesSan = expandLegalMovesSan(getLegalMovesSan(context), settings);
  const matchingMoves =
    input.length === 0 ? [] : sortSanLexically(legalMovesSan.filter((move) => move.startsWith(input)));
  const exactMatches = input.length === 0 ? [] : legalMovesSan.filter((move) => move === input);
  const exactAutoSubmitMatches =
    input.length === 0 ? [] : legalMovesSan.filter((move) => stripAutoSubmitSuffix(move) === input);
  const partialAutoSubmitMatches = input.length === 0 || exactMatches.length > 0 ? [] : matchingMoves;
  const autoSubmitTarget = resolveAutoSubmitTarget(settings, exactAutoSubmitMatches, partialAutoSubmitMatches);
  const shouldAutoSubmit = autoSubmitTarget !== undefined;

  return {
    ...(autoSubmitTarget === undefined ? {} : { autoSubmitTarget }),
    exactMatches,
    highlightedKeyIds: deriveHighlightedKeyIds(input, legalMovesSan, layer, settings),
    legalMovesSan,
    matchingMoves,
    shouldAutoSubmit,
  };
}

function expandLegalMovesSan(
  legalMovesSan: ReadonlyArray<string>,
  settings: KeyboardBehaviorSettings
): ReadonlyArray<string> {
  if (!settings.allowOmittedXInPieceCaptures) {
    return legalMovesSan;
  }

  const isDefined = (alias: string | undefined): alias is string => alias !== undefined;

  const looseCaptureAliases = [...new Set(legalMovesSan.map(toLoosePieceCapture).filter(isDefined))];

  return [...legalMovesSan, ...looseCaptureAliases];
}

function resolveAutoSubmitTarget(
  settings: KeyboardBehaviorSettings,
  exactAutoSubmitMatches: ReadonlyArray<string>,
  partialAutoSubmitMatches: ReadonlyArray<string>
): string | undefined {
  if (!settings.autoSubmit) {
    return undefined;
  }

  if (exactAutoSubmitMatches.length === 1) {
    return exactAutoSubmitMatches[0];
  }

  if (settings.autoSubmitOnSinglePartialMatch && partialAutoSubmitMatches.length === 1) {
    return partialAutoSubmitMatches[0];
  }

  return undefined;
}

function stripAutoSubmitSuffix(move: string): string {
  return move.replace(/[+#]$/, '');
}

function toLoosePieceCapture(move: string): string | undefined {
  const match = /^(?<piece>[KQRBN])(?<disambiguator>[a-h1-8]{0,2})x(?<destination>[a-h][1-8])(?<suffix>[+#]?)$/u.exec(
    move
  );

  if (match?.groups === undefined) {
    return undefined;
  }

  const { destination, disambiguator, piece, suffix } = match.groups;

  return `${piece}${disambiguator}${destination}${suffix}`;
}

function sortSanLexically(moves: ReadonlyArray<string>): ReadonlyArray<string> {
  // eslint-disable-next-line fp/no-mutating-methods
  return [...moves].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
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
