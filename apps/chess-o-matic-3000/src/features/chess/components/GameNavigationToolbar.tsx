import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-solid';
import type { JSX } from 'solid-js';

type GameNavigationToolbarProps = {
  readonly canGoBackward: boolean;
  readonly canGoForward: boolean;
  readonly disabled: boolean;
  readonly onGoToEnd: () => void;
  readonly onGoToStart: () => void;
  readonly onStepBackward: () => void;
  readonly onStepForward: () => void;
};

export function GameNavigationToolbar(props: GameNavigationToolbarProps): JSX.Element {
  return (
    <div class="toolbar-group" role="group" aria-label="Game navigation">
      <button
        aria-label="Jump to first move"
        class="toolbar-icon-button toolbar-icon-button-cobalt"
        disabled={props.disabled || !props.canGoBackward}
        onClick={props.onGoToStart}
        title="Jump to first move"
        type="button"
      >
        <SkipBack class="h-4 w-4" />
      </button>

      <button
        aria-label="Back one move"
        class="toolbar-icon-button toolbar-icon-button-cobalt"
        disabled={props.disabled || !props.canGoBackward}
        onClick={props.onStepBackward}
        title="Back one move"
        type="button"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>

      <button
        aria-label="Forward one move"
        class="toolbar-icon-button toolbar-icon-button-cobalt"
        disabled={props.disabled || !props.canGoForward}
        onClick={props.onStepForward}
        title="Forward one move"
        type="button"
      >
        <ChevronRight class="h-4 w-4" />
      </button>

      <button
        aria-label="Jump to last move"
        class="toolbar-icon-button toolbar-icon-button-cobalt"
        disabled={props.disabled || !props.canGoForward}
        onClick={props.onGoToEnd}
        title="Jump to last move"
        type="button"
      >
        <SkipForward class="h-4 w-4" />
      </button>
    </div>
  );
}
