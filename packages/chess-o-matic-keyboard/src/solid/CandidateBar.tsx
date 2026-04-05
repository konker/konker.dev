/* eslint-disable fp/no-nil */
import { For, type JSX, Show } from 'solid-js';

type CandidateBarProps = {
  readonly candidates: ReadonlyArray<string>;
  readonly enabled: boolean;
  readonly onSelectCandidate: (candidate: string) => void;
  readonly selectedCandidate: string | undefined;
};

export function CandidateBar(props: CandidateBarProps): JSX.Element {
  return (
    <Show when={props.enabled}>
      <section class="chess-keyboard-candidates" data-empty={props.candidates.length === 0} data-slot="candidates">
        <div class="chess-keyboard-candidates-list" data-slot="candidates-list">
          <For each={props.candidates}>
            {(candidate) => (
              <button
                aria-pressed={candidate === props.selectedCandidate}
                class="chess-keyboard-candidate-button"
                data-selected={candidate === props.selectedCandidate}
                data-slot="candidate-button"
                onClick={() => {
                  props.onSelectCandidate(candidate);
                }}
                type="button"
              >
                {candidate}
              </button>
            )}
          </For>
        </div>
      </section>
    </Show>
  );
}
