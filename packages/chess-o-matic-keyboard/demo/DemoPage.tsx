/* eslint-disable fp/no-nil,fp/no-unused-expression */
import { createSignal, For, type JSX } from 'solid-js';

import type { KeyboardContext } from '../src/core/types.js';
import { ChessKeyboard } from '../src/solid/index.js';

type Scenario = {
  readonly description: string;
  readonly id: string;
  readonly name: string;
  readonly context?: KeyboardContext;
};

const scenarios: ReadonlyArray<Scenario> = [
  {
    id: 'notation-only',
    name: 'Notation Only',
    description: 'No board context. Lets you probe the basic SAN-oriented flow.',
  },
  {
    id: 'starting-position',
    name: 'Starting Position',
    description: 'Board-aware context for the standard chess starting position with the usual 20 legal opening moves.',
    context: {
      legalMovesSan: [
        'a3',
        'a4',
        'b3',
        'b4',
        'c3',
        'c4',
        'd3',
        'd4',
        'e3',
        'e4',
        'f3',
        'f4',
        'g3',
        'g4',
        'h3',
        'h4',
        'Na3',
        'Nc3',
        'Nf3',
        'Nh3',
      ],
    },
  },
  {
    id: 'ambiguity',
    name: 'Knight Ambiguity',
    description: 'Board-aware context where Nbd2 and Nfd2 are both legal.',
    context: {
      legalMovesSan: ['Nbd2', 'Nfd2', 'e5'],
    },
  },
  {
    id: 'promotion',
    name: 'Promotion',
    description: 'Board-aware context where e8 requires choosing a promotion piece.',
    context: {
      legalMovesSan: ['e8=Q', 'e8=R', 'e8=B', 'e8=N'],
    },
  },
  {
    id: 'invalid-input',
    name: 'Invalid Input',
    description: 'Sparse legal context so you can freely enter SAN-like junk and compare it against a small hint set.',
    context: {
      legalMovesSan: ['e4', 'Nf3', 'Bb5+'],
    },
  },
] as const;

export function DemoPage(): JSX.Element {
  const [selectedScenarioId, setSelectedScenarioId] = createSignal<Scenario['id']>('notation-only');
  const [submittedMoves, setSubmittedMoves] = createSignal<ReadonlyArray<string>>([]);
  const [resetNonce, setResetNonce] = createSignal(0);

  const selectedScenario = (): Scenario =>
    scenarios.find((scenario) => scenario.id === selectedScenarioId()) ?? scenarios[0]!;

  function handleScenarioSelect(nextScenarioId: Scenario['id']): void {
    setSelectedScenarioId(nextScenarioId);
    setSubmittedMoves([]);
    setResetNonce((value) => value + 1);
  }

  function handleReset(): void {
    setSubmittedMoves([]);
    setResetNonce((value) => value + 1);
  }

  const currentScenario = () => selectedScenario();

  return (
    <main class="demo-shell">
      <section class="demo-hero">
        <p class="demo-kicker">Interactive Example</p>
        <h1>Chess-o-matic Keyboard Playground</h1>
      </section>

      <section class="demo-layout">
        <section class="demo-stage">
          <div class="demo-card">
            <h2>{currentScenario().name}</h2>
            <p>{currentScenario().description}</p>
            <div class="keyboard-frame" data-reset-nonce={resetNonce()}>
              <For each={[resetNonce()]}>
                {() => {
                  const scenario = currentScenario();

                  return (
                    <ChessKeyboard
                      {...(scenario.context === undefined ? {} : { legalMovesSan: scenario.context.legalMovesSan })}
                      onSubmit={(input) => {
                        setSubmittedMoves((currentMoves) => [input, ...currentMoves]);
                      }}
                    />
                  );
                }}
              </For>
            </div>
          </div>
        </section>

        <section class="demo-panel">
          <h2>Scenario</h2>
          <div class="scenario-list">
            <For each={scenarios}>
              {(scenario) => (
                <button
                  classList={{ active: scenario.id === selectedScenarioId() }}
                  onClick={() => {
                    handleScenarioSelect(scenario.id);
                  }}
                  type="button"
                >
                  <strong>{scenario.name}</strong>
                  <span>{scenario.description}</span>
                </button>
              )}
            </For>
          </div>

          <div class="demo-actions">
            <button
              onClick={() => {
                handleReset();
              }}
              type="button"
            >
              Reset Playground
            </button>
          </div>

          <div class="demo-log">
            <h2>Submitted Moves</h2>
            <For each={submittedMoves()}>{(move) => <code>{move}</code>}</For>
            {submittedMoves().length === 0 ? <p>No submitted moves yet.</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
