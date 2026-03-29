import type { JSX } from 'solid-js';

type GameControlPanelProps = {
  readonly canGoBackward: boolean;
  readonly canGoForward: boolean;
  readonly disabled: boolean;
  readonly onGoToEnd: () => void;
  readonly onGoToStart: () => void;
  readonly onStepBackward: () => void;
  readonly onStepForward: () => void;
};

export function GameControlPanel(props: GameControlPanelProps): JSX.Element {
  return (
    <div class="flex flex-wrap gap-3">
      <button disabled={props.disabled || !props.canGoBackward} onClick={props.onGoToStart} type="button">
        |&lt;
      </button>

      <button disabled={props.disabled || !props.canGoBackward} onClick={props.onStepBackward} type="button">
        &lt;
      </button>

      <button disabled={props.disabled || !props.canGoForward} onClick={props.onStepForward} type="button">
        &gt;
      </button>

      <button disabled={props.disabled || !props.canGoForward} onClick={props.onGoToEnd} type="button">
        &gt;|
      </button>
    </div>
  );
}
