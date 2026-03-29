import type { JSX } from 'solid-js';
import { ChevronDown, ChevronRight } from 'lucide-solid';
import type { Component } from 'solid-js';

type CollapsibleSectionProps = {
  readonly children: JSX.Element;
  readonly icon?: Component<{ class?: string }>;
  readonly open?: boolean;
  readonly title: string;
};

export function CollapsibleSection(props: CollapsibleSectionProps): JSX.Element {
  const SectionIcon = props.icon;

  return (
    <details class="group flex flex-col gap-2" open={props.open}>
      <summary class="flex cursor-pointer list-none items-center gap-2">
        <span class="group-open:hidden">
          <ChevronRight class="h-4 w-4" />
        </span>
        <span class="hidden group-open:inline">
          <ChevronDown class="h-4 w-4" />
        </span>
        {SectionIcon ? <SectionIcon class="h-4 w-4" /> : null}
        <span>{props.title}</span>
      </summary>
      <div class="mt-2">{props.children}</div>
    </details>
  );
}
