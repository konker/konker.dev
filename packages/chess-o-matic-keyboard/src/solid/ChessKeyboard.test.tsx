/* eslint-disable fp/no-get-set */
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';
import { createComponent, createSignal } from 'solid-js';
// @ts-expect-error Solid does not publish types for this internal client entrypoint.
import { render } from 'solid-js/web/dist/web.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChessKeyboard } from './ChessKeyboard.js';

function mount(props: Parameters<typeof ChessKeyboard>[0]): {
  readonly cleanup: () => void;
  readonly root: HTMLElement;
} {
  const root = document.createElement('div');
  document.body.append(root);
  const dispose = render(() => createComponent(ChessKeyboard, props), root);

  return {
    cleanup: () => {
      dispose();
      root.remove();
    },
    root,
  };
}

function mountControlled(onSubmit?: Parameters<typeof ChessKeyboard>[0]['onSubmit']): {
  readonly cleanup: () => void;
  readonly root: HTMLElement;
  readonly setSettings: (nextSettings: {
    readonly autoSubmit: boolean;
    readonly candidateBar: boolean;
    readonly keyHighlights: boolean;
    readonly orientation: 'black' | 'white';
    readonly showReadout: boolean;
  }) => void;
  readonly setValue: (nextValue: string) => void;
} {
  const root = document.createElement('div');
  document.body.append(root);
  let setSettings!: (nextSettings: {
    readonly autoSubmit: boolean;
    readonly candidateBar: boolean;
    readonly keyHighlights: boolean;
    readonly orientation: 'black' | 'white';
    readonly showReadout: boolean;
  }) => void;
  let setValue!: (nextValue: string) => void;

  const dispose = render(() => {
    const [value, updateValue] = createSignal('');
    const [settings, updateSettings] = createSignal({
      autoSubmit: true,
      candidateBar: true,
      keyHighlights: true,
      orientation: 'white' as const,
      showReadout: true,
    });

    setValue = updateValue;
    setSettings = updateSettings;

    return createComponent(ChessKeyboard, {
      get legalMovesSan() {
        return ['Nf3', 'Nc3'];
      },
      onChange: updateValue,
      onSettingsChange: updateSettings,
      get settings() {
        return settings();
      },
      ...(onSubmit === undefined ? {} : { onSubmit }),
      get value() {
        return value();
      },
    });
  }, root);

  return {
    cleanup: () => {
      dispose();
      root.remove();
    },
    root,
    setSettings,
    setValue,
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('solid/ChessKeyboard', () => {
  it('should emit onChange for free input that is not legal', () => {
    const onChange = vi.fn();
    const view = mount({ onChange });

    fireEvent.click(getByRole(view.root, 'button', { name: 'Q' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'a' }));
    fireEvent.click(getByRole(view.root, 'button', { name: '1' }));

    expect(onChange).toHaveBeenLastCalledWith('Qa1');

    view.cleanup();
  });

  it('should submit a candidate immediately when clicked', () => {
    const onSubmit = vi.fn();
    const view = mount({ legalMovesSan: ['Nf3', 'Nc3', 'e4'], onSubmit });

    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'Nf3' }));

    expect(onSubmit).toHaveBeenCalledWith(
      'Nf3',
      expect.objectContaining({
        exactLegalMatch: 'Nf3',
        source: 'candidate',
      })
    );

    view.cleanup();
  });

  it('should auto-submit on a unique exact match when enabled', () => {
    const onSubmit = vi.fn();
    const view = mount({ legalMovesSan: ['Nf3', 'Nc3'], onSubmit });

    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'f' }));
    fireEvent.click(getByRole(view.root, 'button', { name: '3' }));

    expect(onSubmit).toHaveBeenCalledWith(
      'Nf3',
      expect.objectContaining({
        exactLegalMatch: 'Nf3',
        source: 'auto',
      })
    );
    expect(view.root.querySelector('output')?.textContent).toBe('');

    view.cleanup();
  });

  it('should suppress auto-submit when disabled in settings', () => {
    const onSubmit = vi.fn();
    const view = mount({ legalMovesSan: ['Nf3', 'Nc3'], onSubmit, settings: { autoSubmit: false } });

    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'f' }));
    fireEvent.click(getByRole(view.root, 'button', { name: '3' }));

    expect(onSubmit).not.toHaveBeenCalled();

    view.cleanup();
  });

  it('should hide the candidate bar when candidateBar is disabled', () => {
    const view = mount({ legalMovesSan: ['Nf3', 'Nc3'], settings: { candidateBar: false } });

    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));

    expect(view.root.querySelector('[data-slot="candidates"]')).toBeNull();

    view.cleanup();
  });

  it('should support flat setting props on the main component', () => {
    const view = mount({
      candidateBar: false,
      legalMovesSan: ['Nf3', 'Nc3'],
      orientation: 'black',
      showReadout: false,
    });

    expect(view.root.querySelector('output')).toBeNull();
    expect(view.root.querySelector('[data-slot="candidates"]')).toBeNull();

    const row4 = Array.from(view.root.querySelectorAll('[data-row="row-4"] button')).map(
      (button) => button.textContent
    );

    expect(row4).toStrictEqual(['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']);

    view.cleanup();
  });

  it('should keep candidate bar space reserved when enabled but empty', () => {
    const view = mount({});

    const candidates = view.root.querySelector('[data-slot="candidates"]');

    expect(candidates).toBeTruthy();
    expect(candidates?.getAttribute('data-empty')).toBe('true');

    view.cleanup();
  });

  it('should allow candidate bar to be toggled from the settings layer', () => {
    const view = mount({ legalMovesSan: ['Nf3', 'Nc3'] });

    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));
    expect(getByRole(view.root, 'button', { name: 'Nf3' })).toBeTruthy();

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));
    fireEvent.click(getByRole(view.root, 'checkbox', { name: 'Candidate Bar' }));

    expect(queryByRole(view.root, 'button', { name: 'Nf3' })).toBeNull();

    view.cleanup();
  });

  it('should allow auto-submit to be toggled from the settings layer', () => {
    const onSubmit = vi.fn();
    const view = mount({ legalMovesSan: ['Nf3', 'Nc3'], onSubmit });

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));
    fireEvent.click(getByRole(view.root, 'checkbox', { name: 'Auto Submit' }));

    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'f' }));
    fireEvent.click(getByRole(view.root, 'button', { name: '3' }));

    expect(onSubmit).not.toHaveBeenCalled();

    view.cleanup();
  });

  it('should support controlled value updates', () => {
    const view = mountControlled();

    fireEvent.click(getByRole(view.root, 'button', { name: 'Q' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'a' }));
    fireEvent.click(getByRole(view.root, 'button', { name: '1' }));

    expect(view.root.querySelector('output')?.textContent).toBe('Qa1');

    view.setValue('e4');

    expect(view.root.querySelector('output')?.textContent).toBe('e4');

    view.cleanup();
  });

  it('should clear the readout after manual submit in uncontrolled mode', () => {
    const onSubmit = vi.fn();
    const view = mount({ onSubmit });

    fireEvent.click(getByRole(view.root, 'button', { name: 'Q' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'a' }));
    fireEvent.click(getByRole(view.root, 'button', { name: '1' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith(
      'Qa1',
      expect.objectContaining({
        input: 'Qa1',
        source: 'manual',
      })
    );
    expect(view.root.querySelector('output')?.textContent).toBe('');

    view.cleanup();
  });

  it('should leave the readout to the parent after submit in controlled mode', () => {
    const onSubmit = vi.fn();
    const view = mountControlled(onSubmit);

    fireEvent.click(getByRole(view.root, 'button', { name: 'Q' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'a' }));
    fireEvent.click(getByRole(view.root, 'button', { name: '1' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith(
      'Qa1',
      expect.objectContaining({
        input: 'Qa1',
        source: 'manual',
      })
    );
    expect(view.root.querySelector('output')?.textContent).toBe('Qa1');

    view.cleanup();
  });

  it('should support controlled settings updates', () => {
    const view = mountControlled();

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));
    fireEvent.click(getByRole(view.root, 'checkbox', { name: 'Candidate Bar' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));

    expect(queryByRole(view.root, 'button', { name: 'Nf3' })).toBeNull();

    view.setSettings({
      autoSubmit: true,
      candidateBar: true,
      keyHighlights: false,
      orientation: 'white',
      showReadout: true,
    });

    expect(getByRole(view.root, 'button', { name: 'Nf3' })).toBeTruthy();

    view.cleanup();
  });

  it('should render all settings controls by default', () => {
    const view = mount({});

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));

    expect(getByRole(view.root, 'checkbox', { name: 'Candidate Bar' })).toBeTruthy();
    expect(getByRole(view.root, 'checkbox', { name: 'Key Highlights' })).toBeTruthy();
    expect(getByRole(view.root, 'checkbox', { name: 'Auto Submit' })).toBeTruthy();
    expect(getByRole(view.root, 'checkbox', { name: 'Show Readout' })).toBeTruthy();
    expect(getByRole(view.root, 'radio', { name: 'White' })).toBeTruthy();
    expect(getByRole(view.root, 'radio', { name: 'Black' })).toBeTruthy();

    view.cleanup();
  });

  it('should hide an individual setting control when configured in visibleSettings', () => {
    const view = mount({
      visibleSettings: {
        candidateBar: false,
      },
    });

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));

    expect(queryByRole(view.root, 'checkbox', { name: 'Candidate Bar' })).toBeNull();
    expect(getByRole(view.root, 'checkbox', { name: 'Key Highlights' })).toBeTruthy();

    view.cleanup();
  });

  it('should hide the orientation setting group when configured in visibleSettings', () => {
    const view = mount({
      visibleSettings: {
        orientation: false,
      },
    });

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));

    expect(queryByRole(view.root, 'radio', { name: 'White' })).toBeNull();
    expect(queryByRole(view.root, 'radio', { name: 'Black' })).toBeNull();

    view.cleanup();
  });

  it('should keep visible settings interactive when visibleSettings hides other controls', () => {
    const view = mount({
      legalMovesSan: ['Nf3', 'Nc3'],
      visibleSettings: {
        autoSubmit: false,
        candidateBar: true,
      },
    });

    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));
    expect(getByRole(view.root, 'button', { name: 'Nf3' })).toBeTruthy();

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));
    fireEvent.click(getByRole(view.root, 'checkbox', { name: 'Candidate Bar' }));

    expect(queryByRole(view.root, 'button', { name: 'Nf3' })).toBeNull();

    view.cleanup();
  });

  it('should keep the readout visible while the settings panel is open', () => {
    const view = mount({});

    expect(view.root.querySelector('output')).toBeTruthy();

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));

    expect(view.root.querySelector('output')).toBeTruthy();

    view.cleanup();
  });

  it('should allow the readout to be hidden from the settings panel', () => {
    const view = mount({});

    expect(view.root.querySelector('output')).toBeTruthy();

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));
    fireEvent.click(getByRole(view.root, 'checkbox', { name: 'Show Readout' }));

    expect(view.root.querySelector('output')).toBeNull();

    view.cleanup();
  });

  it('should keep the key grid visible while the settings panel is open', () => {
    const view = mount({});

    expect(view.root.querySelector('[data-slot="grid"]')).toBeTruthy();

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));

    expect(view.root.querySelector('[data-slot="grid"]')).toBeTruthy();
    expect(view.root.querySelector('[data-slot="settings-panel"]')).toBeTruthy();

    view.cleanup();
  });

  it('should render the settings panel after the candidate bar', () => {
    const view = mount({ legalMovesSan: ['Nf3', 'Nc3'] });

    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));

    const candidates = view.root.querySelector('[data-slot="candidates"]');
    const settingsPanel = view.root.querySelector('[data-slot="settings-panel"]');

    expect(candidates).toBeTruthy();
    expect(settingsPanel).toBeTruthy();
    const candidatesNode = candidates as Node;
    const settingsPanelNode = settingsPanel as Node;

    expect(candidatesNode.compareDocumentPosition(settingsPanelNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    view.cleanup();
  });

  it('should preserve highlighted keys while the settings panel is open', () => {
    const view = mount({ legalMovesSan: ['d3', 'd4', 'e4'] });

    fireEvent.click(getByRole(view.root, 'button', { name: 'd' }));
    expect(getByRole(view.root, 'button', { name: '3' }).getAttribute('data-highlighted')).toBe('true');
    expect(getByRole(view.root, 'button', { name: '4' }).getAttribute('data-highlighted')).toBe('true');

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));

    expect(getByRole(view.root, 'button', { name: '3' }).getAttribute('data-highlighted')).toBe('true');
    expect(getByRole(view.root, 'button', { name: '4' }).getAttribute('data-highlighted')).toBe('true');

    view.cleanup();
  });

  it('should preserve visible secondary keys while the settings panel is open', () => {
    const view = mount({});

    fireEvent.click(getByRole(view.root, 'button', { name: 'Show Secondary Keys' }));
    expect(getByRole(view.root, 'button', { name: 'O-O' })).toBeTruthy();

    fireEvent.click(getByRole(view.root, 'button', { name: 'Settings' }));

    expect(getByRole(view.root, 'button', { name: 'O-O' })).toBeTruthy();

    view.cleanup();
  });

  it('should render the candidate bar before the secondary panel', () => {
    const view = mount({ legalMovesSan: ['d3', 'd4'] });

    fireEvent.click(getByRole(view.root, 'button', { name: 'd' }));
    fireEvent.click(getByRole(view.root, 'button', { name: 'Show Secondary Keys' }));

    const candidates = view.root.querySelector('[data-slot="candidates"]');
    const secondaryPanel = view.root.querySelector('[data-slot="secondary-panel"]');

    expect(candidates).toBeTruthy();
    expect(secondaryPanel).toBeTruthy();
    const candidatesNode = candidates as Node;
    const secondaryPanelNode = secondaryPanel as Node;

    expect(candidatesNode.compareDocumentPosition(secondaryPanelNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    view.cleanup();
  });

  it('should remove key highlights when keyHighlights is disabled', () => {
    const view = mount({ legalMovesSan: ['Nf3', 'Nc3'], settings: { keyHighlights: false } });

    fireEvent.click(getByRole(view.root, 'button', { name: 'N' }));

    expect(getByRole(view.root, 'button', { name: 'f' }).getAttribute('data-highlighted')).toBe('false');
    expect(getByRole(view.root, 'button', { name: 'c' }).getAttribute('data-highlighted')).toBe('false');

    view.cleanup();
  });

  it('should update highlighted keys as input changes', () => {
    const view = mount({
      legalMovesSan: ['d3', 'd4', 'e4'],
    });

    fireEvent.click(getByRole(view.root, 'button', { name: 'd' }));

    expect(getByRole(view.root, 'button', { name: '3' }).getAttribute('data-highlighted')).toBe('true');
    expect(getByRole(view.root, 'button', { name: '4' }).getAttribute('data-highlighted')).toBe('true');
    expect(getByRole(view.root, 'button', { name: '1' }).getAttribute('data-highlighted')).toBe('false');

    view.cleanup();
  });

  it('should order files and ranks from white orientation by default', () => {
    const view = mount({});
    const row2 = Array.from(view.root.querySelectorAll('[data-row="row-2"] button')).map(
      (button) => button.textContent
    );
    const row3 = Array.from(view.root.querySelectorAll('[data-row="row-3"] button')).map(
      (button) => button.getAttribute('aria-label') ?? button.textContent
    );
    const row4 = Array.from(view.root.querySelectorAll('[data-row="row-4"] button')).map(
      (button) => button.textContent
    );
    const row5 = Array.from(view.root.querySelectorAll('[data-row="row-5"] button')).map(
      (button) => button.textContent
    );
    const row6 = Array.from(view.root.querySelectorAll('[data-row="row-6"] button')).map(
      (button) => button.getAttribute('aria-label') ?? button.textContent
    );

    expect(row2).toStrictEqual(['N', 'B', 'R', 'Q', 'K']);
    expect(row3).toStrictEqual(['Capture']);
    expect(row4).toStrictEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    expect(row5).toStrictEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    expect(row6).toStrictEqual([]);

    view.cleanup();
  });

  it('should reverse files and ranks for black orientation', () => {
    const view = mount({
      settings: {
        orientation: 'black',
      },
    });
    const row4 = Array.from(view.root.querySelectorAll('[data-row="row-4"] button')).map(
      (button) => button.textContent
    );
    const row5 = Array.from(view.root.querySelectorAll('[data-row="row-5"] button')).map(
      (button) => button.textContent
    );

    expect(row4).toStrictEqual(['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']);
    expect(row5).toStrictEqual(['8', '7', '6', '5', '4', '3', '2', '1']);

    view.cleanup();
  });

  it('should keep primary labels and highlights visible on the secondary layer', () => {
    const view = mount({
      legalMovesSan: ['d3', 'd4', 'O-O'],
    });

    fireEvent.click(getByRole(view.root, 'button', { name: 'Show Secondary Keys' }));

    expect(getByRole(view.root, 'button', { name: 'N' })).toBeTruthy();
    expect(getByRole(view.root, 'button', { name: 'a' })).toBeTruthy();
    expect(getByRole(view.root, 'button', { name: '1' })).toBeTruthy();

    fireEvent.click(getByRole(view.root, 'button', { name: 'd' }));

    expect(getByRole(view.root, 'button', { name: '3' }).getAttribute('data-highlighted')).toBe('true');
    expect(getByRole(view.root, 'button', { name: '4' }).getAttribute('data-highlighted')).toBe('true');
    expect(getByRole(view.root, 'button', { name: 'O-O' })).toBeTruthy();

    view.cleanup();
  });

  it('should keep settings and submit fixed when the secondary rows are shown', () => {
    const view = mount({});

    const row1Before = Array.from(view.root.querySelectorAll('[data-row="row-1"] button')).map(
      (button) => button.getAttribute('aria-label') ?? button.textContent
    );
    const row6Before = Array.from(view.root.querySelectorAll('[data-row="row-6"] button')).map(
      (button) => button.getAttribute('aria-label') ?? button.textContent
    );
    fireEvent.click(getByRole(view.root, 'button', { name: 'Show Secondary Keys' }));
    const row1After = Array.from(view.root.querySelectorAll('[data-row="row-1"] button')).map(
      (button) => button.getAttribute('aria-label') ?? button.textContent
    );
    const row6After = Array.from(view.root.querySelectorAll('[data-row="row-6"] button')).map(
      (button) => button.getAttribute('aria-label') ?? button.textContent
    );

    expect(row1Before).toStrictEqual(['Show Secondary Keys', 'Settings', 'Clear', 'Submit']);
    expect(row1After).toStrictEqual(['Hide Secondary Keys', 'Settings', 'Clear', 'Submit']);
    expect(row6Before).toStrictEqual([]);
    expect(row6After).toStrictEqual([]);

    view.cleanup();
  });

  it('should render the requested secondary layout rows in the secondary panel', () => {
    const view = mount({});

    fireEvent.click(getByRole(view.root, 'button', { name: 'Show Secondary Keys' }));

    const row7 = Array.from(view.root.querySelectorAll('[data-row="secondary-row-1"] button')).map(
      (button) => button.textContent
    );
    const row8 = Array.from(view.root.querySelectorAll('[data-row="secondary-row-2"] button')).map(
      (button) => button.textContent
    );
    const row9 = Array.from(view.root.querySelectorAll('[data-row="secondary-row-3"] button')).map(
      (button) => button.textContent
    );

    expect(row7).toStrictEqual(['O-O', 'O-O-O']);
    expect(row8).toStrictEqual(['+', '#', '=', '-']);
    expect(row9).toStrictEqual(['!', '!!', '!?', '?', '??', '?!']);

    view.cleanup();
  });
});
