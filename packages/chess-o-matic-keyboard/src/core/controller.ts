import { createInitialKeyboardModel, reduceKeyboardModel, submitKeyboardModel } from './state.js';
import type {
  KeyboardAction,
  KeyboardBehaviorSettings,
  KeyboardContext,
  KeyboardController,
  KeyboardKeyId,
  KeyboardLayer,
  KeyboardModel,
  KeyboardSubmitSource,
} from './types.js';

export function createKeyboardController(initialContext?: KeyboardContext): KeyboardController {
  // eslint-disable-next-line fp/no-let
  let model = createInitialKeyboardModel(initialContext);

  const apply = (action: KeyboardAction) => {
    // eslint-disable-next-line fp/no-mutation
    model = reduceKeyboardModel(model, action);
    return model.state;
  };

  return {
    clear: () => apply({ type: 'clear' }),
    getModel: () => model,
    getState: () => model.state,
    pressKey: (keyId: KeyboardKeyId) => apply({ keyId, type: 'press-key' }),
    reset: () => apply({ type: 'reset' }),
    selectCandidate: (candidate: string) => apply({ candidate, type: 'select-candidate' }),
    setContext: (context?: KeyboardContext) =>
      apply(context === undefined ? { type: 'set-context' } : { context, type: 'set-context' }),
    setInput: (input: string) => apply({ input, type: 'set-input' }),
    setLayer: (layer: KeyboardLayer) => apply({ layer, type: 'set-layer' }),
    setSettings: (settings: Partial<KeyboardBehaviorSettings>) => apply({ settings, type: 'set-settings' }),
    submit: (source?: KeyboardSubmitSource) => submitKeyboardModel(model, source),
    toggleSecondary: () => apply({ type: 'toggle-secondary' }),
  };
}

export function getKeyboardControllerModel(controller: KeyboardController): KeyboardModel {
  return controller.getModel();
}
