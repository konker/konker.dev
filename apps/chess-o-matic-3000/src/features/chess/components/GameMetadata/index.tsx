import { Calendar, Clock3, Hash, MapPin, Trophy, User } from 'lucide-solid';
import type { JSX } from 'solid-js';

import type { GameMetadataData } from './types';

type GameMetadataProps = {
  readonly metadata: GameMetadataData;
  readonly onMetadataChange: (metadata: GameMetadataData) => void;
};

const TERMINATION_OPTIONS = [
  'abandoned',
  'adjudication',
  'death',
  'emergency',
  'normal',
  'rules infraction',
  'time forfeit',
  'unterminated',
] as const;

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
        <div class="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <label class="flex flex-col gap-1">
            {renderLabel(<Clock3 class="h-4 w-4" />, 'Time Control')}
            <input
              onInput={(event) => updateField('timeControl', event.currentTarget.value)}
              type="text"
              value={props.metadata.timeControl}
            />
          </label>
          <label class="flex flex-col gap-1">
            <span>Termination</span>
            <select
              onInput={(event) => updateField('termination', event.currentTarget.value)}
              value={props.metadata.termination}
            >
              <option value=""></option>
              {TERMINATION_OPTIONS.map(function renderOption(option): JSX.Element {
                return <option value={option}>{option}</option>;
              })}
            </select>
          </label>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="flex flex-col gap-3">
          <h2 class="flex items-center gap-2 text-base font-semibold">
            <User class="h-4 w-4" />
            <span>White</span>
          </h2>
          <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <input
              onInput={(event) => updatePlayerField('white', 'name', event.currentTarget.value)}
              placeholder="Name"
              type="text"
              value={props.metadata.white.name}
            />
            <input
              onInput={(event) => updatePlayerField('white', 'elo', event.currentTarget.value)}
              placeholder="Elo"
              type="text"
              value={props.metadata.white.elo}
            />
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <h2 class="flex items-center gap-2 text-base font-semibold">
            <User class="h-4 w-4" />
            <span>Black</span>
          </h2>
          <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <input
              onInput={(event) => updatePlayerField('black', 'name', event.currentTarget.value)}
              placeholder="Name"
              type="text"
              value={props.metadata.black.name}
            />
            <input
              onInput={(event) => updatePlayerField('black', 'elo', event.currentTarget.value)}
              placeholder="Elo"
              type="text"
              value={props.metadata.black.elo}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
