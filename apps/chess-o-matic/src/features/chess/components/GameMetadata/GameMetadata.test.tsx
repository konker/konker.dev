import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import { GameMetadata } from './index';
import { GAME_METADATA_EMPTY } from './types';

describe('GameMetadata', () => {
  it('emits updated metadata when fields are committed', () => {
    const root = document.createElement('div');
    const onMetadataChange = vi.fn();
    document.body.append(root);

    render(() => {
      const [metadata, setMetadata] = createSignal(GAME_METADATA_EMPTY);

      function handleMetadataChange(nextMetadata: typeof GAME_METADATA_EMPTY): void {
        setMetadata(nextMetadata);
        onMetadataChange(nextMetadata);
      }

      return <GameMetadata gameId={() => 'game-1'} metadata={metadata} onMetadataChange={handleMetadataChange} />;
    }, root);

    function getRequiredInput(selector: string): HTMLInputElement {
      const input = root.querySelector(selector) as HTMLInputElement | null;
      if (!input) {
        throw new Error(`Expected GameMetadata input to render for selector: ${selector}`);
      }
      return input;
    }

    const eventInput = getRequiredInput('input[type="text"]');
    eventInput.value = 'Club Championship';
    eventInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(eventInput.value).toBe('Club Championship');
    expect(onMetadataChange).not.toHaveBeenCalled();
    eventInput.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    const dateInput = getRequiredInput('input[aria-label="Date"]');
    dateInput.value = '29/03/2026';
    dateInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
    dateInput.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    const resultInput = getRequiredInput('input[aria-label="Result"]');
    resultInput.value = '1-0';
    resultInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
    resultInput.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    const whiteNameInput = getRequiredInput('input[aria-label="White Name"]');
    whiteNameInput.value = 'Alice';
    whiteNameInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
    whiteNameInput.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    expect(onMetadataChange).toHaveBeenCalledTimes(4);
    expect(onMetadataChange).toHaveBeenLastCalledWith({
      ...GAME_METADATA_EMPTY,
      date: '2026-03-29',
      event: 'Club Championship',
      result: '1-0',
      white: {
        ...GAME_METADATA_EMPTY.white,
        name: 'Alice',
      },
    });
  });

  it('keeps sibling inputs mounted when a previous field commits on blur', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    render(() => {
      const [metadata, setMetadata] = createSignal(GAME_METADATA_EMPTY);

      return <GameMetadata gameId={() => 'game-1'} metadata={metadata} onMetadataChange={setMetadata} />;
    }, root);

    function getRequiredInput(ariaLabel: string): HTMLInputElement {
      const input = root.querySelector(`input[aria-label="${ariaLabel}"]`) as HTMLInputElement | null;
      if (!input) {
        throw new Error(`Expected GameMetadata input to render for aria-label: ${ariaLabel}`);
      }
      return input;
    }

    const dateInput = getRequiredInput('Date');
    const whiteNameInput = getRequiredInput('White Name');
    const whiteNameInputBeforeCommit = whiteNameInput;

    whiteNameInput.dispatchEvent(new FocusEvent('focus', { bubbles: false }));
    dateInput.value = '30/03/2026';
    dateInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
    dateInput.dispatchEvent(new FocusEvent('blur', { bubbles: true, relatedTarget: whiteNameInput }));
    await Promise.resolve();

    expect(getRequiredInput('White Name')).toBe(whiteNameInputBeforeCommit);
    expect(dateInput.value).toBe('30/03/2026');
  });

  it('syncs external metadata updates without clobbering the active field draft', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    let setMetadata: ((value: typeof GAME_METADATA_EMPTY) => void) | undefined;

    render(() => {
      const [metadata, updateMetadata] = createSignal(GAME_METADATA_EMPTY);
      setMetadata = updateMetadata;

      return <GameMetadata gameId={() => 'game-1'} metadata={metadata} onMetadataChange={updateMetadata} />;
    }, root);

    function getRequiredInput(ariaLabel: string): HTMLInputElement {
      const input = root.querySelector(`input[aria-label="${ariaLabel}"]`) as HTMLInputElement | null;
      if (!input) {
        throw new Error(`Expected GameMetadata input to render for aria-label: ${ariaLabel}`);
      }
      return input;
    }

    const whiteNameInput = getRequiredInput('White Name');
    const resultInput = getRequiredInput('Result');

    whiteNameInput.dispatchEvent(new FocusEvent('focus', { bubbles: false }));
    whiteNameInput.value = 'Alice';
    whiteNameInput.dispatchEvent(new InputEvent('input', { bubbles: true }));

    setMetadata?.({
      ...GAME_METADATA_EMPTY,
      result: '1-0',
    });
    await Promise.resolve();

    expect(getRequiredInput('White Name').value).toBe('Alice');
    expect(resultInput.value).toBe('1-0');
  });
});
