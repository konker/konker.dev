import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-solid';
import type { JSX } from 'solid-js';

type GameNavigationPanelProps = {
  readonly canGoBackward: boolean;
  readonly canGoForward: boolean;
  readonly disabled: boolean;
  readonly onGoToEnd: () => void;
  readonly onGoToStart: () => void;
  readonly onStepBackward: () => void;
  readonly onStepForward: () => void;
};

export function GameNavigationPanel(props: GameNavigationPanelProps): JSX.Element {
  return (
    <div class="flex flex-wrap gap-3">
      <button
        aria-label="Jump to first move"
        class="flex items-center justify-center"
        disabled={props.disabled || !props.canGoBackward}
        onClick={props.onGoToStart}
        title="Jump to first move"
        type="button"
      >
        <SkipBack class="h-4 w-4" />
      </button>

      <button
        aria-label="Back one move"
        class="flex items-center justify-center"
        disabled={props.disabled || !props.canGoBackward}
        onClick={props.onStepBackward}
        title="Back one move"
        type="button"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>

      <button
        aria-label="Forward one move"
        class="flex items-center justify-center"
        disabled={props.disabled || !props.canGoForward}
        onClick={props.onStepForward}
        title="Forward one move"
        type="button"
      >
        <ChevronRight class="h-4 w-4" />
      </button>

      <button
        aria-label="Jump to last move"
        class="flex items-center justify-center"
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
