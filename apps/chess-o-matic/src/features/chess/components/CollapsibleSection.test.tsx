import { render } from 'solid-js/web';
import { describe, expect, it } from 'vitest';

import { CollapsibleSection } from './CollapsibleSection';

describe('CollapsibleSection', () => {
  it('restores persisted open state from localStorage', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    localStorage.setItem('chess-o-matic-3000/ui/section-open/info', 'false');

    render(
      () => (
        <CollapsibleSection open storageKey="info" title="Info">
          <div>Section body</div>
        </CollapsibleSection>
      ),
      root
    );

    await Promise.resolve();

    const details = root.querySelector('details') as HTMLDetailsElement | null;
    expect(details?.open).toBe(false);
  });
});
