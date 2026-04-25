import { Calendar, Clock3, Hash, MapPin, Medal, Trophy, User } from 'lucide-solid';
import type { Accessor, Component, JSX } from 'solid-js';
import { createEffect, createSignal, on } from 'solid-js';

import type { GameMetadataData } from './types';

type GameMetadataProps = {
  readonly gameId: Accessor<string>;
  readonly metadata: Accessor<GameMetadataData>;
  readonly onMetadataChange: (metadata: GameMetadataData) => void;
};

type DraftFieldName =
  | 'event'
  | 'site'
  | 'date'
  | 'round'
  | 'timeControl'
  | 'termination'
  | 'white.name'
  | 'white.elo'
  | 'black.name'
  | 'black.elo'
  | 'result';

type FieldLabelProps = {
  readonly icon?: JSX.Element;
  readonly text: string;
};

type TextInputProps = {
  readonly ariaLabel?: string;
  readonly fieldName: DraftFieldName;
  readonly onBlur: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
  readonly onFocus: JSX.EventHandlerUnion<HTMLInputElement, FocusEvent>;
  readonly onInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>;
  readonly placeholder?: string;
  readonly type?: string;
  readonly value: string;
};

type SelectInputProps = {
  readonly fieldName: DraftFieldName;
  readonly onChange: JSX.EventHandlerUnion<HTMLSelectElement, Event>;
  readonly onFocus: JSX.EventHandlerUnion<HTMLSelectElement, FocusEvent>;
  readonly options: ReadonlyArray<string>;
  readonly value: string;
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

const FieldLabel: Component<FieldLabelProps> = (props) => {
  return (
    <span class="paper-field-label">
      {props.icon}
      <span>{props.text}</span>
    </span>
  );
};

const TextInput: Component<TextInputProps> = (props) => {
  return (
    <span class="paper-field-frame">
      <input
        aria-label={props.ariaLabel}
        class="paper-field-control"
        data-field={props.fieldName}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        onInput={props.onInput}
        placeholder={props.placeholder}
        type={props.type ?? 'text'}
        value={props.value}
      />
    </span>
  );
};

const SelectInput: Component<SelectInputProps> = (props) => {
  return (
    <span class="paper-field-frame">
      <select
        class="paper-field-control"
        data-field={props.fieldName}
        onChange={props.onChange}
        onFocus={props.onFocus}
        value={props.value}
      >
        <option value=""></option>
        {props.options.map(function renderOption(option): JSX.Element {
          return <option value={option}>{option}</option>;
        })}
      </select>
    </span>
  );
};

export function GameMetadata(props: GameMetadataProps): JSX.Element {
  let formRef: HTMLElement | undefined;
  const [focusedField, setFocusedField] = createSignal<DraftFieldName>();

  function createDraftMetadata(metadata: GameMetadataData): GameMetadataData {
    return {
      ...metadata,
      date: formatDateForDisplay(metadata.date),
    };
  }

  const [draft, setDraft] = createSignal<GameMetadataData>(createDraftMetadata(props.metadata()));

  function syncDraftFromMetadata(metadata: GameMetadataData, preserveField?: DraftFieldName): void {
    setDraft((current) => ({
      event: preserveField === 'event' ? current.event : metadata.event,
      site: preserveField === 'site' ? current.site : metadata.site,
      date: preserveField === 'date' ? current.date : formatDateForDisplay(metadata.date),
      round: preserveField === 'round' ? current.round : metadata.round,
      timeControl: preserveField === 'timeControl' ? current.timeControl : metadata.timeControl,
      termination: preserveField === 'termination' ? current.termination : metadata.termination,
      white: {
        elo: preserveField === 'white.elo' ? current.white.elo : metadata.white.elo,
        name: preserveField === 'white.name' ? current.white.name : metadata.white.name,
      },
      black: {
        elo: preserveField === 'black.elo' ? current.black.elo : metadata.black.elo,
        name: preserveField === 'black.name' ? current.black.name : metadata.black.name,
      },
      result: preserveField === 'result' ? current.result : metadata.result,
    }));
  }

  function resolveActiveField(): DraftFieldName | undefined {
    if (focusedField()) {
      return focusedField();
    }

    if (!formRef || typeof document === 'undefined') {
      return undefined;
    }

    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement) || !formRef.contains(activeElement)) {
      return undefined;
    }

    const fieldName = activeElement.dataset.field;
    return fieldName as DraftFieldName | undefined;
  }

  function handleFieldBlur(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget;

    if (!(relatedTarget instanceof HTMLElement) || !formRef?.contains(relatedTarget)) {
      setFocusedField(undefined);
      return;
    }

    const nextField = relatedTarget.dataset.field;
    setFocusedField(nextField as DraftFieldName | undefined);
  }

  createEffect(
    on(props.gameId, () => {
      syncDraftFromMetadata(props.metadata());
    })
  );

  createEffect(
    on(props.metadata, (metadata) => {
      syncDraftFromMetadata(metadata, resolveActiveField());
    })
  );

  function readDraftMetadata(): GameMetadataData {
    const currentDraft = draft();
    return {
      ...currentDraft,
      date: normalizeDateForStorage(currentDraft.date),
      white: {
        ...currentDraft.white,
      },
      black: {
        ...currentDraft.black,
      },
    };
  }

  function commitForm(): void {
    props.onMetadataChange(readDraftMetadata());
  }

  function commitDateInput(): void {
    const normalizedDate = normalizeDateForStorage(draft().date);
    props.onMetadataChange({
      ...readDraftMetadata(),
      date: normalizedDate,
    });
    setDraft((current) => ({
      ...current,
      date: formatDateForDisplay(normalizedDate),
    }));
  }

  return (
    <section aria-label="Game Metadata" class="panel-muted flex flex-col gap-4" ref={formRef}>
      <div class="metadata-grid">
        <label class="paper-field">
          <FieldLabel icon={<Trophy class="h-4 w-4" />} text="Event" />
          <TextInput
            fieldName="event"
            onBlur={(event) => {
              handleFieldBlur(event);
              commitForm();
            }}
            onFocus={() => setFocusedField('event')}
            onInput={(event) =>
              setDraft((current) => ({
                ...current,
                event: event.currentTarget.value,
              }))
            }
            value={draft().event}
          />
        </label>
        <label class="paper-field">
          <FieldLabel icon={<MapPin class="h-4 w-4" />} text="Site" />
          <TextInput
            fieldName="site"
            onBlur={(event) => {
              handleFieldBlur(event);
              commitForm();
            }}
            onFocus={() => setFocusedField('site')}
            onInput={(event) =>
              setDraft((current) => ({
                ...current,
                site: event.currentTarget.value,
              }))
            }
            value={draft().site}
          />
        </label>
        <label class="paper-field metadata-key-field">
          <FieldLabel icon={<Calendar class="h-4 w-4" />} text="Date" />
          <TextInput
            ariaLabel="Date"
            fieldName="date"
            onBlur={(event) => {
              handleFieldBlur(event);
              commitDateInput();
            }}
            onFocus={() => setFocusedField('date')}
            onInput={(event) =>
              setDraft((current) => ({
                ...current,
                date: event.currentTarget.value,
              }))
            }
            placeholder="dd/mm/yyyy"
            type="text"
            value={draft().date}
          />
        </label>
        <label class="paper-field">
          <FieldLabel icon={<Hash class="h-4 w-4" />} text="Round" />
          <TextInput
            fieldName="round"
            onBlur={(event) => {
              handleFieldBlur(event);
              commitForm();
            }}
            onFocus={() => setFocusedField('round')}
            onInput={(event) =>
              setDraft((current) => ({
                ...current,
                round: event.currentTarget.value,
              }))
            }
            value={draft().round}
          />
        </label>
        <div class="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          <label class="paper-field">
            <FieldLabel icon={<Clock3 class="h-4 w-4" />} text="Time Control" />
            <TextInput
              fieldName="timeControl"
              onBlur={(event) => {
                handleFieldBlur(event);
                commitForm();
              }}
              onFocus={() => setFocusedField('timeControl')}
              onInput={(event) =>
                setDraft((current) => ({
                  ...current,
                  timeControl: event.currentTarget.value,
                }))
              }
              value={draft().timeControl}
            />
          </label>
          <label class="paper-field">
            <FieldLabel text="Termination" />
            <SelectInput
              fieldName="termination"
              onChange={(event) => {
                const termination = event.currentTarget.value;
                setDraft((current) => ({
                  ...current,
                  termination,
                }));
                props.onMetadataChange({
                  ...readDraftMetadata(),
                  termination,
                });
              }}
              onFocus={() => setFocusedField('termination')}
              options={TERMINATION_OPTIONS}
              value={draft().termination}
            />
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
              <FieldLabel text="Name" />
              <TextInput
                ariaLabel="White Name"
                fieldName="white.name"
                onBlur={(event) => {
                  handleFieldBlur(event);
                  commitForm();
                }}
                onFocus={() => setFocusedField('white.name')}
                onInput={(event) =>
                  setDraft((current) => ({
                    ...current,
                    white: {
                      ...current.white,
                      name: event.currentTarget.value,
                    },
                  }))
                }
                placeholder="Name"
                type="text"
                value={draft().white.name}
              />
            </label>
            <label class="paper-field">
              <FieldLabel text="Elo" />
              <TextInput
                ariaLabel="White Elo"
                fieldName="white.elo"
                onBlur={(event) => {
                  handleFieldBlur(event);
                  commitForm();
                }}
                onFocus={() => setFocusedField('white.elo')}
                onInput={(event) =>
                  setDraft((current) => ({
                    ...current,
                    white: {
                      ...current.white,
                      elo: event.currentTarget.value,
                    },
                  }))
                }
                placeholder="Elo"
                type="text"
                value={draft().white.elo}
              />
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
              <FieldLabel text="Name" />
              <TextInput
                ariaLabel="Black Name"
                fieldName="black.name"
                onBlur={(event) => {
                  handleFieldBlur(event);
                  commitForm();
                }}
                onFocus={() => setFocusedField('black.name')}
                onInput={(event) =>
                  setDraft((current) => ({
                    ...current,
                    black: {
                      ...current.black,
                      name: event.currentTarget.value,
                    },
                  }))
                }
                placeholder="Name"
                type="text"
                value={draft().black.name}
              />
            </label>
            <label class="paper-field">
              <FieldLabel text="Elo" />
              <TextInput
                ariaLabel="Black Elo"
                fieldName="black.elo"
                onBlur={(event) => {
                  handleFieldBlur(event);
                  commitForm();
                }}
                onFocus={() => setFocusedField('black.elo')}
                onInput={(event) =>
                  setDraft((current) => ({
                    ...current,
                    black: {
                      ...current.black,
                      elo: event.currentTarget.value,
                    },
                  }))
                }
                placeholder="Elo"
                type="text"
                value={draft().black.elo}
              />
            </label>
          </div>
        </div>

        <label class="paper-field sm:col-span-2">
          <FieldLabel icon={<Medal class="h-4 w-4" />} text="Result" />
          <TextInput
            ariaLabel="Result"
            fieldName="result"
            onBlur={(event) => {
              handleFieldBlur(event);
              commitForm();
            }}
            onFocus={() => setFocusedField('result')}
            onInput={(event) =>
              setDraft((current) => ({
                ...current,
                result: event.currentTarget.value,
              }))
            }
            type="text"
            value={draft().result}
          />
        </label>
      </div>
    </section>
  );
}
