import type { JSX } from 'solid-js';

type FenPanelProps = {
  readonly fen: string;
};

export function FenPanel(props: FenPanelProps): JSX.Element {
  return (
    <label class="flex flex-col gap-2">
      <span>FEN</span>
      <div aria-label="FEN">{props.fen}</div>
    </label>
  );
}
