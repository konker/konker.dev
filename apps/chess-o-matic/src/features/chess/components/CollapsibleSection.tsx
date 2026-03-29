import type { JSX } from 'solid-js';

type CollapsibleSectionProps = {
  readonly children: JSX.Element;
  readonly open?: boolean;
  readonly title: string;
};

export function CollapsibleSection(props: CollapsibleSectionProps): JSX.Element {
  return (
    <details class="flex flex-col gap-2" open={props.open}>
      <summary>{props.title}</summary>
      <div class="mt-2">{props.children}</div>
    </details>
  );
}
