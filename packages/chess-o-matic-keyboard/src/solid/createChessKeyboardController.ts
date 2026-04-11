import { type Accessor, createSignal } from 'solid-js';

import { createInitialKeyboardModel, reduceKeyboardModel, submitKeyboardModel } from '../core/state.js';
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
} from '../core/types.js';

export type SolidChessKeyboardController = {
  readonly clear: () => KeyboardState;
  readonly dispatch: (action: KeyboardAction) => KeyboardState;
  readonly getModel: () => KeyboardModel;
  readonly getState: () => KeyboardState;
  readonly model: Accessor<KeyboardModel>;
  readonly pressKey: (keyId: KeyboardKeyId) => KeyboardState;
  readonly reset: () => KeyboardState;
  readonly selectCandidate: (candidate: string) => KeyboardState;
  readonly setContext: (context?: KeyboardContext) => KeyboardState;
  readonly setInput: (input: string) => KeyboardState;
  readonly setLayer: (layer: KeyboardLayer) => KeyboardState;
  readonly setSettings: (settings: Partial<KeyboardBehaviorSettings>) => KeyboardState;
  readonly state: Accessor<KeyboardState>;
  readonly submit: (source?: KeyboardSubmitSource) => KeyboardSubmitEvent;
  readonly toggleSecondary: () => KeyboardState;
  readonly toggleSettings: () => KeyboardState;
};

export type CreateChessKeyboardControllerOptions = {
  readonly context?: KeyboardContext;
  readonly initialModel?: KeyboardModel;
};

export function createChessKeyboardController(
  options?: CreateChessKeyboardControllerOptions
): SolidChessKeyboardController {
  const [model, setModel] = createSignal(options?.initialModel ?? createInitialKeyboardModel(options?.context));

  const dispatch = (action: KeyboardAction): KeyboardState => {
    const nextModel = reduceKeyboardModel(model(), action);

    setModel(nextModel);
    return nextModel.state;
  };

  return {
    clear: () => dispatch({ type: 'clear' }),
    dispatch,
    getModel: model,
    getState: () => model().state,
    model,
    pressKey: (keyId: KeyboardKeyId) => dispatch({ keyId, type: 'press-key' }),
    reset: () => dispatch({ type: 'reset' }),
    selectCandidate: (candidate: string) => dispatch({ candidate, type: 'select-candidate' }),
    setContext: (context?: KeyboardContext) =>
      dispatch(context === undefined ? { type: 'set-context' } : { context, type: 'set-context' }),
    setInput: (input: string) => dispatch({ input, type: 'set-input' }),
    setLayer: (layer: KeyboardLayer) => dispatch({ layer, type: 'set-layer' }),
    setSettings: (settings: Partial<KeyboardBehaviorSettings>) => dispatch({ settings, type: 'set-settings' }),
    state: () => model().state,
    submit: (source?: KeyboardSubmitSource) => submitKeyboardModel(model(), source),
    toggleSecondary: () => dispatch({ type: 'toggle-secondary' }),
    toggleSettings: () => dispatch({ type: 'toggle-settings' }),
  };
}

export const useChessKeyboard = createChessKeyboardController;
