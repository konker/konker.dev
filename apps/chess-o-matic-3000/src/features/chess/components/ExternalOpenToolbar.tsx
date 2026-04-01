import { ExternalLink } from 'lucide-solid';
import type { JSX } from 'solid-js';

type ExternalOpenToolbarProps = {
  readonly disabled: boolean;
  readonly onOpenChessDotCom: () => void;
  readonly onOpenLichess: () => void;
};

export function ExternalOpenToolbar(props: ExternalOpenToolbarProps): JSX.Element {
  return (
    <div class="toolbar-group">
      <button class="toolbar-button" disabled={props.disabled} onClick={props.onOpenLichess} type="button">
        <ExternalLink class="h-4 w-4" />
        <span>Open in Lichess</span>
      </button>

      <button class="toolbar-button" disabled={props.disabled} onClick={props.onOpenChessDotCom} type="button">
        <ExternalLink class="h-4 w-4" />
        <span>Open in Chess.com</span>
      </button>
    </div>
  );
}
