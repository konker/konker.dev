import './app.css';

import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import type { JSX } from 'solid-js';
import { Suspense } from 'solid-js';

function renderRouterRoot(props: { readonly children?: JSX.Element }): JSX.Element {
  return <Suspense>{props.children}</Suspense>;
}

export default function App(): JSX.Element {
  return (
    <MetaProvider>
      <Router root={renderRouterRoot}>
        <FileRoutes />
      </Router>
    </MetaProvider>
  );
}
