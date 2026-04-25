import type { JSX } from 'solid-js';

type FenPanelProps = {
  readonly fen: string;
};

export function FenPanel(props: FenPanelProps): JSX.Element {
  return (
    <div class="utility-panel">
      <div aria-label="FEN" class="utility-code-block">
        {props.fen}
      </div>
    </div>
  );
}
