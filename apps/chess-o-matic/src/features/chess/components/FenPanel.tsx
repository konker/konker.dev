import { Copy } from 'lucide-solid';
import type { JSX } from 'solid-js';

type FenPanelProps = {
  readonly fen: string;
};

export function FenPanel(props: FenPanelProps): JSX.Element {
  async function copyFen(): Promise<void> {
    await navigator.clipboard.writeText(props.fen);
  }

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span>FEN</span>
        <button class="flex items-center gap-2" onClick={() => void copyFen()} type="button">
          <Copy class="h-4 w-4" />
          <span>Copy FEN</span>
        </button>
      </div>
      <div aria-label="FEN">{props.fen}</div>
    </div>
  );
}
