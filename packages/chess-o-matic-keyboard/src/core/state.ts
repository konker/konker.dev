/* eslint-disable fp/no-nil */
import { buildCandidateAnalysis } from './candidates.js';
import { normalizeInput } from './normalizer.js';
import type {
  KeyboardAction,
  KeyboardBehaviorSettings,
  KeyboardContext,
  KeyboardKeyId,
  KeyboardLayer,
  KeyboardModel,
  KeyboardState,
  KeyboardSubmitEvent,
  KeyboardSubmitSource,
} from './types.js';
import { DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS, KEYBOARD_KEYS } from './types.js';

export function createInitialKeyboardModel(context?: KeyboardContext): KeyboardModel {
  return createKeyboardModel('', context, 'primary', DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS);
}

export function createKeyboardModel(
  input: string,
  context: KeyboardContext | undefined,
  layer: KeyboardLayer,
  settings: KeyboardBehaviorSettings
): KeyboardModel {
  return {
    ...(context === undefined ? {} : { context }),
    state: deriveKeyboardState(input, context, layer, settings),
  };
}

export function deriveKeyboardState(
  input: string,
  context: KeyboardContext | undefined,
  layer: KeyboardLayer,
  settings: KeyboardBehaviorSettings
): KeyboardState {
  const normalizedInput = normalizeInput(input);
  const analysis = buildCandidateAnalysis(normalizedInput, context, layer, settings);

  return {
    ...(analysis.autoSubmitMatch === undefined ? {} : { autoSubmitMatch: analysis.autoSubmitMatch }),
    exactMatches: analysis.exactMatches,
    highlightedKeyIds: analysis.highlightedKeyIds,
    input: normalizedInput,
    layer,
    legalMovesSan: analysis.legalMovesSan,
    matchingMoves: analysis.matchingMoves,
    settings,
    shouldAutoSubmit: analysis.shouldAutoSubmit,
  };
}

export function reduceKeyboardModel(model: KeyboardModel, action: KeyboardAction): KeyboardModel {
  switch (action.type) {
    case 'clear':
    case 'reset':
      return withInput(model, '');
    case 'press-key':
      return withInput(model, `${model.state.input}${keyIdToValue(action.keyId) ?? ''}`);
    case 'select-candidate':
      return {
        ...withInput(model, action.candidate),
        state: {
          ...withInput(model, action.candidate).state,
          selectedCandidateId: action.candidate,
        },
      };
    case 'set-context':
      return createKeyboardModel(model.state.input, action.context, model.state.layer, model.state.settings);
    case 'set-input':
      return withInput(model, action.input);
    case 'set-layer':
      return createKeyboardModel(model.state.input, model.context, action.layer, model.state.settings);
    case 'set-settings':
      return createKeyboardModel(model.state.input, model.context, model.state.layer, {
        ...model.state.settings,
        ...action.settings,
      });
    case 'toggle-secondary':
      return createKeyboardModel(
        model.state.input,
        model.context,
        model.state.layer === 'secondary' ? 'primary' : 'secondary',
        model.state.settings
      );
    case 'toggle-settings':
      return createKeyboardModel(
        model.state.input,
        model.context,
        model.state.layer === 'settings' ? 'primary' : 'settings',
        model.state.settings
      );
  }
}

export function submitKeyboardModel(
  model: KeyboardModel,
  source: KeyboardSubmitSource = 'manual'
): KeyboardSubmitEvent {
  return {
    ...(model.state.exactMatches.length === 1
      ? { exactLegalMatch: model.state.exactMatches[0] }
      : model.state.autoSubmitMatch === undefined
        ? {}
        : { exactLegalMatch: model.state.autoSubmitMatch }),
    input: model.state.input,
    matchingMoves: model.state.matchingMoves,
    source,
    state: model.state,
  };
}

function keyIdToValue(keyId: KeyboardKeyId): string | undefined {
  return KEYBOARD_KEYS.find((key) => key.id === keyId && key.kind === 'notation')?.value;
}

function withInput(model: KeyboardModel, input: string): KeyboardModel {
  return createKeyboardModel(input, model.context, model.state.layer, model.state.settings);
}
