import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';

import { GameMetadata } from './index';
import { GAME_METADATA_EMPTY } from './types';

describe('GameMetadata', () => {
  it('emits updated metadata when form fields change', () => {
    const root = document.createElement('div');
    const onMetadataChange = vi.fn();
    document.body.append(root);

    render(() => {
      const [metadata, setMetadata] = createSignal(GAME_METADATA_EMPTY);

      function handleMetadataChange(nextMetadata: typeof GAME_METADATA_EMPTY): void {
        setMetadata(nextMetadata);
        onMetadataChange(nextMetadata);
      }

      return <GameMetadata metadata={metadata()} onMetadataChange={handleMetadataChange} />;
    }, root);

    const eventInput = root.querySelector('input[type="text"]') as HTMLInputElement | null;
    const dateInput = root.querySelector('input[type="date"]') as HTMLInputElement | null;
    const whiteNameInput = root.querySelectorAll('input[type="text"]').item(4) as HTMLInputElement | null;

    if (!eventInput || !dateInput || !whiteNameInput) {
      throw new Error('Expected GameMetadata inputs to render.');
    }

    eventInput.value = 'Club Championship';
    eventInput.dispatchEvent(new InputEvent('input', { bubbles: true }));

    dateInput.value = '2026-03-29';
    dateInput.dispatchEvent(new InputEvent('input', { bubbles: true }));

    whiteNameInput.value = 'Alice';
    whiteNameInput.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(onMetadataChange).toHaveBeenCalledTimes(3);
    expect(onMetadataChange).toHaveBeenLastCalledWith({
      ...GAME_METADATA_EMPTY,
      date: '2026-03-29',
      event: 'Club Championship',
      white: {
        ...GAME_METADATA_EMPTY.white,
        name: 'Alice',
      },
    });
  });
});
