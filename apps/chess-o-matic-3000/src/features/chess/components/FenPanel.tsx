import { Copy, CopyCheck } from 'lucide-solid';
import type { JSX } from 'solid-js';
import { createEffect, createSignal, Show } from 'solid-js';

type FenPanelProps = {
  readonly fen: string;
};

export function FenPanel(props: FenPanelProps): JSX.Element {
  const [isCopied, setIsCopied] = createSignal(false);

  createEffect(function resetCopiedState(): void {
    props.fen;
    setIsCopied(false);
  });

  async function copyFen(): Promise<void> {
    await navigator.clipboard.writeText(props.fen);
    setIsCopied(true);
  }

  return (
    <div class="utility-panel">
      <div class="utility-toolbar">
        <button class="toolbar-button" onClick={() => void copyFen()} type="button">
          <Show when={isCopied()} fallback={<Copy class="h-4 w-4" />}>
            <CopyCheck class="h-4 w-4" />
          </Show>
          <span>{isCopied() ? 'Copied' : 'Copy FEN'}</span>
        </button>
      </div>
      <div aria-label="FEN" class="utility-code-block">
        {props.fen}
      </div>
    </div>
  );
}
