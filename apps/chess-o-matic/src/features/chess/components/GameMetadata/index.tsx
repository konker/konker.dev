import type { JSX } from 'solid-js';
import { Badge, Calendar, Clock3, Hash, MapPin, Trophy, User } from 'lucide-solid';

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

  function renderLabel(icon: JSX.Element, text: string): JSX.Element {
    return (
      <span class="flex items-center gap-2">
        {icon}
        <span>{text}</span>
      </span>
    );
  }

  return (
    <section aria-label="Game Metadata" class="flex flex-col gap-3">
      <h2>Game Metadata</h2>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex flex-col gap-1">
          {renderLabel(<Trophy class="h-4 w-4" />, 'Event')}
          <input
            onInput={(event) => updateField('event', event.currentTarget.value)}
            type="text"
            value={props.metadata.event}
          />
        </label>
        <label class="flex flex-col gap-1">
          {renderLabel(<MapPin class="h-4 w-4" />, 'Site')}
          <input
            onInput={(event) => updateField('site', event.currentTarget.value)}
            type="text"
            value={props.metadata.site}
          />
        </label>
        <label class="flex flex-col gap-1">
          {renderLabel(<Calendar class="h-4 w-4" />, 'Date')}
          <input
            onInput={(event) => updateField('date', event.currentTarget.value)}
            type="date"
            value={props.metadata.date}
          />
        </label>
        <label class="flex flex-col gap-1">
          {renderLabel(<Hash class="h-4 w-4" />, 'Round')}
          <input
            onInput={(event) => updateField('round', event.currentTarget.value)}
            type="text"
            value={props.metadata.round}
          />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-2">
          {renderLabel(<Clock3 class="h-4 w-4" />, 'Time Control')}
          <input
            onInput={(event) => updateField('timeControl', event.currentTarget.value)}
            type="text"
            value={props.metadata.timeControl}
          />
        </label>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="flex flex-col gap-3">
          <h2 class="flex items-center gap-2 text-base font-semibold">
            <User class="h-4 w-4" />
            <span>White</span>
          </h2>
          <label class="flex flex-col gap-1">
            {renderLabel(<User class="h-4 w-4" />, 'White Name')}
            <input
              onInput={(event) => updatePlayerField('white', 'name', event.currentTarget.value)}
              type="text"
              value={props.metadata.white.name}
            />
          </label>
          <label class="flex flex-col gap-1">
            {renderLabel(<Badge class="h-4 w-4" />, 'White Elo')}
            <input
              onInput={(event) => updatePlayerField('white', 'elo', event.currentTarget.value)}
              type="text"
              value={props.metadata.white.elo}
            />
          </label>
        </div>

        <div class="flex flex-col gap-3">
          <h2 class="flex items-center gap-2 text-base font-semibold">
            <User class="h-4 w-4" />
            <span>Black</span>
          </h2>
          <label class="flex flex-col gap-1">
            {renderLabel(<User class="h-4 w-4" />, 'Black Name')}
            <input
              onInput={(event) => updatePlayerField('black', 'name', event.currentTarget.value)}
              type="text"
              value={props.metadata.black.name}
            />
          </label>
          <label class="flex flex-col gap-1">
            {renderLabel(<Badge class="h-4 w-4" />, 'Black Elo')}
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
