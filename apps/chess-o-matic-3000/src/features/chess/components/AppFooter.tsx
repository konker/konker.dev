import type { JSX } from 'solid-js';

export function AppFooter(): JSX.Element {
  return (
    <footer class="app-footer">
      <span>Chess-o-matic</span>
      <span>
        ©{' '}
        <a href="https://konker.dev/" rel="noreferrer" target="_blank">
          konker.dev
        </a>{' '}
        2026
      </span>
    </footer>
  );
}
