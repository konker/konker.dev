import type { JSX } from 'solid-js';

import type { GameMetadataData } from './types';

type GameMetadataProps = {
  readonly metadata: GameMetadataData;
  readonly onMetadataChange: (metadata: GameMetadataData) => void;
};

export function GameMetadata(props: GameMetadataProps): JSX.Element {
  function updateField<K extends keyof GameMetadataData>(field: K, value: GameMetadataData[K]): void {
    props.onMetadataChange({
      ...props.metadata,
      [field]: value,
    });
  }

  function updatePlayerField(color: 'white' | 'black', field: 'name' | 'elo', value: string): void {
    updateField(color, {
      ...props.metadata[color],
      [field]: value,
    });
  }

  return (
    <section aria-label="Game Metadata" class="flex flex-col gap-3">
      <h2>Game Metadata</h2>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1">
          <span>Event</span>
          <input
            onInput={(event) => updateField('event', event.currentTarget.value)}
            type="text"
            value={props.metadata.event}
          />
        </label>
        <label class="flex flex-col gap-1">
          <span>Site</span>
          <input
            onInput={(event) => updateField('site', event.currentTarget.value)}
            type="text"
            value={props.metadata.site}
          />
        </label>
        <label class="flex flex-col gap-1">
          <span>Date</span>
          <input
            onInput={(event) => updateField('date', event.currentTarget.value)}
            type="date"
            value={props.metadata.date}
          />
        </label>
        <label class="flex flex-col gap-1">
          <span>Round</span>
          <input
            onInput={(event) => updateField('round', event.currentTarget.value)}
            type="text"
            value={props.metadata.round}
          />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span>Time Control</span>
          <input
            onInput={(event) => updateField('timeControl', event.currentTarget.value)}
            type="text"
            value={props.metadata.timeControl}
          />
        </label>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="flex flex-col gap-3">
          <h2 class="text-base font-semibold">White</h2>
          <label class="flex flex-col gap-1">
            <span>White Name</span>
            <input
              onInput={(event) => updatePlayerField('white', 'name', event.currentTarget.value)}
              type="text"
              value={props.metadata.white.name}
            />
          </label>
          <label class="flex flex-col gap-1">
            <span>White Elo</span>
            <input
              onInput={(event) => updatePlayerField('white', 'elo', event.currentTarget.value)}
              type="text"
              value={props.metadata.white.elo}
            />
          </label>
        </div>

        <div class="flex flex-col gap-3">
          <h2 class="text-base font-semibold">Black</h2>
          <label class="flex flex-col gap-1">
            <span>Black Name</span>
            <input
              onInput={(event) => updatePlayerField('black', 'name', event.currentTarget.value)}
              type="text"
              value={props.metadata.black.name}
            />
          </label>
          <label class="flex flex-col gap-1">
            <span>Black Elo</span>
            <input
              onInput={(event) => updatePlayerField('black', 'elo', event.currentTarget.value)}
              type="text"
              value={props.metadata.black.elo}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
