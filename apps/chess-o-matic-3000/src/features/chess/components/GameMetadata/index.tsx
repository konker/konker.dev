import { Calendar, Clock3, Hash, MapPin, Medal, Trophy, User } from 'lucide-solid';
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
      <span class="paper-field-label">
        {icon}
        <span>{text}</span>
      </span>
    );
  }

  function renderTextInput(
    value: string,
    onInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>,
    type = 'text',
    placeholder?: string,
    ariaLabel?: string
  ): JSX.Element {
    return (
      <span class="paper-field-frame">
        <input
          aria-label={ariaLabel}
          class="paper-field-control"
          onInput={onInput}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      </span>
    );
  }

  function renderSelect(
    value: string,
    onInput: JSX.EventHandlerUnion<HTMLSelectElement, InputEvent>,
    options: readonly string[]
  ): JSX.Element {
    return (
      <span class="paper-field-frame">
        <select class="paper-field-control" onInput={onInput} value={value}>
          <option value=""></option>
          {options.map(function renderOption(option): JSX.Element {
            return <option value={option}>{option}</option>;
          })}
        </select>
      </span>
    );
  }

  return (
    <section aria-label="Game Metadata" class="panel-muted flex flex-col gap-4">
      <div class="metadata-grid">
        <label class="paper-field">
          {renderLabel(<Trophy class="h-4 w-4" />, 'Event')}
          {renderTextInput(props.metadata.event, (event) => updateField('event', event.currentTarget.value))}
        </label>
        <label class="paper-field">
          {renderLabel(<MapPin class="h-4 w-4" />, 'Site')}
          {renderTextInput(props.metadata.site, (event) => updateField('site', event.currentTarget.value))}
        </label>
        <label class="paper-field">
          {renderLabel(<Calendar class="h-4 w-4" />, 'Date')}
          {renderTextInput(props.metadata.date, (event) => updateField('date', event.currentTarget.value), 'date')}
        </label>
        <label class="paper-field">
          {renderLabel(<Hash class="h-4 w-4" />, 'Round')}
          {renderTextInput(props.metadata.round, (event) => updateField('round', event.currentTarget.value))}
        </label>
        <div class="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          <label class="paper-field">
            {renderLabel(<Clock3 class="h-4 w-4" />, 'Time Control')}
            {renderTextInput(props.metadata.timeControl, (event) => updateField('timeControl', event.currentTarget.value))}
          </label>
          <label class="paper-field">
            <span class="paper-field-label">Termination</span>
            {renderSelect(
              props.metadata.termination,
              (event) => updateField('termination', event.currentTarget.value),
              TERMINATION_OPTIONS
            )}
          </label>
        </div>
      </div>

      <div class="metadata-player-grid">
        <div class="metadata-player-panel">
          <h2 class="metadata-player-title">
            <User class="h-4 w-4" />
            <span>White</span>
          </h2>
          <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <label class="paper-field">
              <span class="paper-field-label">Name</span>
          {renderTextInput(
            props.metadata.white.name,
            (event) => updatePlayerField('white', 'name', event.currentTarget.value),
            'text',
            'Name',
            'White Name'
          )}
            </label>
            <label class="paper-field">
              <span class="paper-field-label">Elo</span>
          {renderTextInput(
            props.metadata.white.elo,
            (event) => updatePlayerField('white', 'elo', event.currentTarget.value),
            'text',
            'Elo',
            'White Elo'
          )}
            </label>
          </div>
        </div>

        <div class="metadata-player-panel">
          <h2 class="metadata-player-title">
            <User class="h-4 w-4" />
            <span>Black</span>
          </h2>
          <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <label class="paper-field">
              <span class="paper-field-label">Name</span>
          {renderTextInput(
            props.metadata.black.name,
            (event) => updatePlayerField('black', 'name', event.currentTarget.value),
            'text',
            'Name',
            'Black Name'
          )}
            </label>
            <label class="paper-field">
              <span class="paper-field-label">Elo</span>
          {renderTextInput(
            props.metadata.black.elo,
            (event) => updatePlayerField('black', 'elo', event.currentTarget.value),
            'text',
            'Elo',
            'Black Elo'
          )}
            </label>
          </div>
        </div>

        <label class="paper-field sm:col-span-2">
          {renderLabel(<Medal class="h-4 w-4" />, 'Result')}
          {renderTextInput(props.metadata.result, (event) => updateField('result', event.currentTarget.value), 'text', undefined, 'Result')}
        </label>
      </div>
    </section>
  );
}
