import type { JSX } from 'solid-js';

type PgnPanelProps = {
  readonly pgn: string;
};

export function PgnPanel(props: PgnPanelProps): JSX.Element {
  async function copyPgn(): Promise<void> {
    await navigator.clipboard.writeText(props.pgn);
  }

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span>PGN</span>
        <button onClick={() => void copyPgn()} type="button">
          Copy PGN
        </button>
      </div>
      <textarea aria-label="PGN" class="min-h-32 w-full resize-y" readOnly value={props.pgn} />
    </div>
  );
}
