import type { JSX } from 'solid-js';

type SanReadoutProps = {
  readonly value: string;
};

export function SanReadout(props: SanReadoutProps): JSX.Element {
  return (
    <output class="chess-keyboard-readout" data-slot="readout">
      {props.value}
    </output>
  );
}
