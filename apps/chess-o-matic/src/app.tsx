import './app.css';

import { Link, Meta, MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import type { JSX } from 'solid-js';
import { ErrorBoundary, Suspense } from 'solid-js';

function renderRouterRoot(props: { readonly children?: JSX.Element }): JSX.Element {
  return (
    <ErrorBoundary
      fallback={(err: unknown) => (
        <p class="error-banner">{err instanceof Error ? err.message : 'An unexpected error occurred.'}</p>
      )}
    >
      <Suspense>{props.children}</Suspense>
    </ErrorBoundary>
  );
}

export default function App(): JSX.Element {
  return (
    <MetaProvider>
      <Meta charset="utf-8" />
      <Meta content="width=device-width, initial-scale=1" name="viewport" />
      <Meta content="#cf4b87" name="theme-color" />
      <Meta content="yes" name="mobile-web-app-capable" />
      <Meta content="yes" name="apple-mobile-web-app-capable" />
      <Meta content="default" name="apple-mobile-web-app-status-bar-style" />
      <Meta content="Chess-o-matic" name="apple-mobile-web-app-title" />
      <Link href="/images/favicon.ico" rel="icon" sizes="any" />
      <Link href="/images/icons/favicon-16x16.png" rel="icon" sizes="16x16" type="image/png" />
      <Link href="/images/icons/favicon-32x32.png" rel="icon" sizes="32x32" type="image/png" />
      <Link href="/images/icons/icon-192.png" rel="apple-touch-icon" sizes="180x180" />
      <Link href="/site.webmanifest" rel="manifest" />
      <Router root={renderRouterRoot}>
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}
