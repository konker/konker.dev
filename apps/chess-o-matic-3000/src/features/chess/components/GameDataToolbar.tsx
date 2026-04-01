import { Plus, Trash2 } from 'lucide-solid';
import type { JSX } from 'solid-js';

type GameDataToolbarProps = {
  readonly disabled: boolean;
  readonly onDiscardGame: () => void;
  readonly onNewGame: () => void;
};

export function GameDataToolbar(props: GameDataToolbarProps): JSX.Element {
  return (
    <div class="toolbar-group">
      <button class="toolbar-button toolbar-button-primary" disabled={props.disabled} onClick={props.onNewGame} type="button">
        <Plus class="h-4 w-4" />
        <span>New game</span>
      </button>

      <button class="toolbar-button toolbar-button-danger" disabled={props.disabled} onClick={props.onDiscardGame} type="button">
        <Trash2 class="h-4 w-4" />
        <span>Discard game</span>
      </button>
    </div>
  );
}
