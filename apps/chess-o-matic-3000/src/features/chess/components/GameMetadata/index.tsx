import { Calendar, Clock3, Hash, MapPin, Medal, Trophy, User } from 'lucide-solid';
import type { Accessor, JSX } from 'solid-js';
import { createEffect, on } from 'solid-js';

import type { GameMetadataData } from './types';

type GameMetadataProps = {
  readonly gameId: Accessor<string>;
  readonly metadata: Accessor<GameMetadataData>;
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

function formatDateForDisplay(value: string): string {
  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!isoDateMatch) {
    return value;
  }

  const [, year, month, day] = isoDateMatch;
  return `${day}/${month}/${year}`;
}

function normalizeDateForStorage(value: string): string {
  const trimmedValue = value.trim();
  const displayDateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmedValue);

  if (!displayDateMatch) {
    return trimmedValue;
  }

  const [, day, month, year] = displayDateMatch;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function GameMetadata(props: GameMetadataProps): JSX.Element {
  let eventInputRef: HTMLInputElement | undefined;
  let siteInputRef: HTMLInputElement | undefined;
  let dateInputRef: HTMLInputElement | undefined;
  let roundInputRef: HTMLInputElement | undefined;
  let timeControlInputRef: HTMLInputElement | undefined;
  let terminationSelectRef: HTMLSelectElement | undefined;
  let whiteNameInputRef: HTMLInputElement | undefined;
  let whiteEloInputRef: HTMLInputElement | undefined;
  let blackNameInputRef: HTMLInputElement | undefined;
  let blackEloInputRef: HTMLInputElement | undefined;
  let resultInputRef: HTMLInputElement | undefined;

  function syncFormFromMetadata(metadata: GameMetadataData): void {
    if (eventInputRef) {
      eventInputRef.value = metadata.event;
    }
    if (siteInputRef) {
      siteInputRef.value = metadata.site;
    }
    if (dateInputRef) {
      dateInputRef.value = formatDateForDisplay(metadata.date);
    }
    if (roundInputRef) {
      roundInputRef.value = metadata.round;
    }
    if (timeControlInputRef) {
      timeControlInputRef.value = metadata.timeControl;
    }
    if (terminationSelectRef) {
      terminationSelectRef.value = metadata.termination;
    }
    if (whiteNameInputRef) {
      whiteNameInputRef.value = metadata.white.name;
    }
    if (whiteEloInputRef) {
      whiteEloInputRef.value = metadata.white.elo;
    }
    if (blackNameInputRef) {
      blackNameInputRef.value = metadata.black.name;
    }
    if (blackEloInputRef) {
      blackEloInputRef.value = metadata.black.elo;
    }
    if (resultInputRef) {
      resultInputRef.value = metadata.result;
    }
  }

  createEffect(
    on(props.gameId, () => {
      syncFormFromMetadata(props.metadata());
    })
  );

  function readFormMetadata(): GameMetadataData {
    const metadata = props.metadata();
    return {
      ...metadata,
      event: eventInputRef?.value ?? metadata.event,
      site: siteInputRef?.value ?? metadata.site,
      date: normalizeDateForStorage(dateInputRef?.value ?? metadata.date),
      round: roundInputRef?.value ?? metadata.round,
      timeControl: timeControlInputRef?.value ?? metadata.timeControl,
      termination: terminationSelectRef?.value ?? metadata.termination,
      white: {
        ...metadata.white,
        name: whiteNameInputRef?.value ?? metadata.white.name,
        elo: whiteEloInputRef?.value ?? metadata.white.elo,
      },
      black: {
        ...metadata.black,
        name: blackNameInputRef?.value ?? metadata.black.name,
        elo: blackEloInputRef?.value ?? metadata.black.elo,
      },
      result: resultInputRef?.value ?? metadata.result,
    };
  }

  function commitForm(): void {
    props.onMetadataChange(readFormMetadata());
  }

  function commitDateInput(): void {
    commitForm();

    if (dateInputRef) {
      dateInputRef.value = formatDateForDisplay(normalizeDateForStorage(dateInputRef.value));
    }
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
    ref: ((element: HTMLInputElement) => void) | undefined,
    onBlur: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>,
    type = 'text',
    placeholder?: string,
    ariaLabel?: string
  ): JSX.Element {
    return (
      <span class="paper-field-frame">
        <input
          aria-label={ariaLabel}
          class="paper-field-control"
          onBlur={onBlur}
          placeholder={placeholder}
          ref={ref}
          type={type}
          value={value}
        />
      </span>
    );
  }

  function renderSelect(
    value: string,
    ref: ((element: HTMLSelectElement) => void) | undefined,
    onChange: JSX.EventHandlerUnion<HTMLSelectElement, Event>,
    options: ReadonlyArray<string>
  ): JSX.Element {
    return (
      <span class="paper-field-frame">
        <select class="paper-field-control" onChange={onChange} ref={ref} value={value}>
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
          {renderTextInput(
            props.metadata().event,
            (element) => {
              eventInputRef = element;
            },
            () => commitForm()
          )}
        </label>
        <label class="paper-field">
          {renderLabel(<MapPin class="h-4 w-4" />, 'Site')}
          {renderTextInput(
            props.metadata().site,
            (element) => {
              siteInputRef = element;
            },
            () => commitForm()
          )}
        </label>
        <label class="paper-field metadata-key-field">
          {renderLabel(<Calendar class="h-4 w-4" />, 'Date')}
          {renderTextInput(
            props.metadata().date,
            (element) => {
              dateInputRef = element;
            },
            () => commitDateInput(),
            'text',
            'dd/mm/yyyy',
            'Date'
          )}
        </label>
        <label class="paper-field">
          {renderLabel(<Hash class="h-4 w-4" />, 'Round')}
          {renderTextInput(
            props.metadata().round,
            (element) => {
              roundInputRef = element;
            },
            () => commitForm()
          )}
        </label>
        <div class="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          <label class="paper-field">
            {renderLabel(<Clock3 class="h-4 w-4" />, 'Time Control')}
            {renderTextInput(
              props.metadata().timeControl,
              (element) => {
                timeControlInputRef = element;
              },
              () => commitForm()
            )}
          </label>
          <label class="paper-field">
            <span class="paper-field-label">Termination</span>
            {renderSelect(
              props.metadata().termination,
              (element) => {
                terminationSelectRef = element;
              },
              () => commitForm(),
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
                props.metadata().white.name,
                (element) => {
                  whiteNameInputRef = element;
                },
                () => commitForm(),
                'text',
                'Name',
                'White Name'
              )}
            </label>
            <label class="paper-field">
              <span class="paper-field-label">Elo</span>
              {renderTextInput(
                props.metadata().white.elo,
                (element) => {
                  whiteEloInputRef = element;
                },
                () => commitForm(),
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
                props.metadata().black.name,
                (element) => {
                  blackNameInputRef = element;
                },
                () => commitForm(),
                'text',
                'Name',
                'Black Name'
              )}
            </label>
            <label class="paper-field">
              <span class="paper-field-label">Elo</span>
              {renderTextInput(
                props.metadata().black.elo,
                (element) => {
                  blackEloInputRef = element;
                },
                () => commitForm(),
                'text',
                'Elo',
                'Black Elo'
              )}
            </label>
          </div>
        </div>

        <label class="paper-field sm:col-span-2">
          {renderLabel(<Medal class="h-4 w-4" />, 'Result')}
          {renderTextInput(
            props.metadata().result,
            (element) => {
              resultInputRef = element;
            },
            () => commitForm(),
            'text',
            undefined,
            'Result'
          )}
        </label>
      </div>
    </section>
  );
}
