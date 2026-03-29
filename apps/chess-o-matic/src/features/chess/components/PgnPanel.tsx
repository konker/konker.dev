import type { JSX } from 'solid-js';

type PgnPanelProps = {
  readonly pgn: string;
};

export function PgnPanel(props: PgnPanelProps): JSX.Element {
  return (
    <label class="flex flex-col gap-2">
      <span>PGN</span>
      <textarea aria-label="PGN" class="min-h-32 w-full resize-y" readOnly value={props.pgn} />
    </label>
  );
}
