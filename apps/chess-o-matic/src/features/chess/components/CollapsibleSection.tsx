import { ChevronDown, ChevronRight } from 'lucide-solid';
import type { JSX } from 'solid-js';
import type { Component } from 'solid-js';
import { createSignal, onMount } from 'solid-js';

type CollapsibleSectionProps = {
  readonly children: JSX.Element;
  readonly headerAside?: JSX.Element;
  readonly icon?: Component<{ class?: string }>;
  readonly onToggle?: (isOpen: boolean) => void;
  readonly open?: boolean;
  readonly storageKey?: string;
  readonly title: string;
};

const COLLAPSIBLE_SECTION_STORAGE_PREFIX = 'chess-o-matic-3000/ui/section-open/';

export function CollapsibleSection(props: CollapsibleSectionProps): JSX.Element {
  let detailsEl: HTMLDetailsElement | undefined;
  const SectionIcon = props.icon;

  function resolvedStorageKey(): string {
    return `${COLLAPSIBLE_SECTION_STORAGE_PREFIX}${props.storageKey ?? props.title.toLowerCase()}`;
  }

  function loadStoredOpenState(): boolean {
    if (typeof localStorage === 'undefined') {
      return Boolean(props.open);
    }

    const storedValue = localStorage.getItem(resolvedStorageKey());
    return storedValue === null ? Boolean(props.open) : storedValue === 'true';
  }

  const [isOpen, setIsOpen] = createSignal(loadStoredOpenState());

  function persistOpenState(nextValue: boolean): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(resolvedStorageKey(), JSON.stringify(nextValue));
  }

  function handleToggle(): void {
    const nextValue = Boolean(detailsEl?.open);
    setIsOpen(nextValue);
    persistOpenState(nextValue);
    props.onToggle?.(nextValue);
  }

  onMount(() => {
    if (detailsEl) {
      detailsEl.open = isOpen();
    }

    props.onToggle?.(isOpen());
  });

  return (
    <details class="section-shell group" onToggle={handleToggle} open={isOpen()} ref={detailsEl}>
      <summary class="section-summary">
        <span class="section-summary-copy">
          <span class="group-open:hidden">
            <ChevronRight class="section-summary-chevron" />
          </span>
          <span class="hidden group-open:inline">
            <ChevronDown class="section-summary-chevron" />
          </span>
          {SectionIcon ? <SectionIcon class="section-summary-icon" /> : null}
          <span class="flex flex-col">
            <span class="section-summary-title">{props.title}</span>
          </span>
        </span>
        {props.headerAside ? (
          <span
            class="flex items-center gap-2"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {props.headerAside}
          </span>
        ) : null}
      </summary>
      <div class="section-body">{props.children}</div>
    </details>
  );
}
